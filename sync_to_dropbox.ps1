[CmdletBinding()]
param (
    [string]$AccessToken = $env:DROPBOX_ACCESS_TOKEN
)

$WorkspaceDir = $PSScriptRoot
if (-not $WorkspaceDir) { $WorkspaceDir = Get-Location }
$FilesDir = Join-Path $WorkspaceDir "Files"
$ThumbnailsDir = Join-Path $FilesDir "thumbnails"
$CacheFile = Join-Path $WorkspaceDir "dropbox_sync_cache.json"
$OutputDataFile = Join-Path $WorkspaceDir "media_data.js"
$ffmpegPath = Join-Path $WorkspaceDir "ffmpeg.exe"

# Ensure thumbnails directory exists
if (-not (Test-Path $ThumbnailsDir)) {
    New-Item -ItemType Directory -Path $ThumbnailsDir -Force | Out-Null
}

# Categories definition
$Categories = @{
    "ugc" = @{ "dirName" = "Talent"; "isVideo" = $true }
    "videos" = @{ "dirName" = "Videos"; "isVideo" = $true }
    "static" = @{ "dirName" = "Static Posts"; "isVideo" = $false }
}

# Generate local data fallback function
function Generate-LocalData {
    Write-Host "No Dropbox Access Token detected."
    Write-Host "Generating local/offline media_data.json..."
    $resultData = @{
        "ugc" = @()
        "videos" = @()
        "static" = @()
    }
    
    foreach ($catKey in $Categories.Keys) {
        $catInfo = $Categories[$catKey]
        $catDir = Join-Path $FilesDir $catInfo.dirName
        if (-not (Test-Path $catDir)) { continue }
        
        $files = Get-ChildItem -Path $catDir -File | Where-Object { $_.Name -ne "desktop.ini" -and $_.Extension -in ".mp4", ".mov", ".png", ".jpg", ".jpeg" }
        foreach ($file in $files) {
            $localPath = "Files/$($catInfo.dirName)/$($file.Name)"
            $thumbPath = $localPath
            
            if ($catInfo.isVideo) {
                $thumbName = "$([System.IO.Path]::GetFileNameWithoutExtension($file.Name))_thumb.jpg"
                $localThumbFile = Join-Path $ThumbnailsDir $thumbName
                
                # Generate local thumbnail if missing
                if (-not (Test-Path $localThumbFile)) {
                    Write-Host "  Generating offline thumbnail for $($file.Name)..."
                    try {
                        if (Test-Path $ffmpegPath) {
                            Start-Process -FilePath $ffmpegPath -ArgumentList "-y", "-ss", "00:00:01", "-i", "`"$($file.FullName)`"", "-vframes", "1", "-q:v", "2", "`"$localThumbFile`"" -NoNewWindow -Wait
                        } else {
                            Start-Process -FilePath "ffmpeg" -ArgumentList "-y", "-ss", "00:00:01", "-i", "`"$($file.FullName)`"", "-vframes", "1", "-q:v", "2", "`"$localThumbFile`"" -NoNewWindow -Wait
                        }
                    } catch {
                        Write-Warning "  Failed to generate local thumbnail: $_"
                    }
                }
                
                if (Test-Path $localThumbFile) {
                    $thumbPath = "Files/thumbnails/$thumbName"
                }
            }
            
            $fileObj = [PSCustomObject]@{
                "name" = $file.Name
                "src" = $localPath
                "thumbnail" = $thumbPath
                "isVideo" = $catInfo.isVideo
            }
            $resultData[$catKey] += $fileObj
        }
    }
    
    $json = ConvertTo-Json $resultData -Depth 5
    Set-Content -Path $OutputDataFile -Value "var portfolioData = $json;" -Encoding utf8
    Write-Host "Success! Local offline media_data.js generated at $OutputDataFile"
}

if (-not $AccessToken) {
    Generate-LocalData
    exit 0
}

# Load cache
$Cache = @{}
if (Test-Path $CacheFile) {
    try {
        $Cache = Get-Content $CacheFile -Raw | ConvertFrom-Json -AsHashtable
    } catch {
        Write-Warning "Could not parse cache file, starting fresh."
    }
}

# Helper to calculate file hash
function Get-FileHashString ($filePath) {
    return (Get-FileHash -Path $filePath -Algorithm MD5).Hash
}

# Chunked upload helper (for files larger than 100MB)
$ChunkLimit = 100MB
function Upload-File ($localPath, $dropboxPath) {
    $fileSize = (Get-Item $localPath).Length
    if ($fileSize -le $ChunkLimit) {
        Write-Host "  Uploading $($localPath | Split-Path -Leaf) ($([Math]::Round($fileSize/1MB, 2)) MB)..."
        $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
        
        $headers = @{
            "Authorization" = "Bearer $AccessToken"
            "Dropbox-API-Arg" = (ConvertTo-Json @{
                "path" = $dropboxPath
                "mode" = "overwrite"
                "autorename" = $false
                "mute" = $true
                "strict_conflict" = $false
            } -Compress)
            "Content-Type" = "application/octet-stream"
        }
        
        $uri = "https://content.dropboxapi.com/2/files/upload"
        $res = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $fileBytes
        return $res
    } else {
        # Chunked upload
        Write-Host "  Uploading $($localPath | Split-Path -Leaf) in chunks ($([Math]::Round($fileSize/1MB, 2)) MB)..."
        $chunkSize = 10MB
        $fileStream = [System.IO.File]::OpenRead($localPath)
        $buffer = New-Object byte[] $chunkSize
        
        # Start session
        Write-Host "  Starting session..."
        $bytesRead = $fileStream.Read($buffer, 0, $chunkSize)
        $startHeaders = @{
            "Authorization" = "Bearer $AccessToken"
            "Dropbox-API-Arg" = (ConvertTo-Json @{ "close" = $false } -Compress)
            "Content-Type" = "application/octet-stream"
        }
        $startBytes = New-Object byte[] $bytesRead
        [System.Buffer]::BlockCopy($buffer, 0, $startBytes, 0, $bytesRead)
        
        $startRes = Invoke-RestMethod -Uri "https://content.dropboxapi.com/2/files/upload_session/start" -Method Post -Headers $startHeaders -Body $startBytes
        $sessionId = $startRes.session_id
        
        $offset = $bytesRead
        while ($offset -lt $fileSize) {
            $bytesRead = $fileStream.Read($buffer, 0, $chunkSize)
            if ($bytesRead -eq 0) { break }
            
            Write-Host "  Appending chunk at offset $offset ($([Math]::Round(($offset/$fileSize)*100, 0))%)..."
            
            $appendHeaders = @{
                "Authorization" = "Bearer $AccessToken"
                "Dropbox-API-Arg" = (ConvertTo-Json @{
                    "cursor" = @{ "session_id" = $sessionId; "offset" = $offset }
                    "close" = $false
                } -Compress)
                "Content-Type" = "application/octet-stream"
            }
            $appendBytes = New-Object byte[] $bytesRead
            [System.Buffer]::BlockCopy($buffer, 0, $appendBytes, 0, $bytesRead)
            
            Invoke-RestMethod -Uri "https://content.dropboxapi.com/2/files/upload_session/append_v2" -Method Post -Headers $appendHeaders -Body $appendBytes | Out-Null
            $offset += $bytesRead
        }
        $fileStream.Close()
        
        # Finish session
        Write-Host "  Finishing session and committing to $dropboxPath..."
        $finishHeaders = @{
            "Authorization" = "Bearer $AccessToken"
            "Dropbox-API-Arg" = (ConvertTo-Json @{
                "cursor" = @{ "session_id" = $sessionId; "offset" = $fileSize }
                "commit" = @{
                    "path" = $dropboxPath
                    "mode" = "overwrite"
                    "autorename" = $false
                    "mute" = $true
                    "strict_conflict" = $false
                }
            } -Compress)
            "Content-Type" = "application/octet-stream"
        }
        $finishRes = Invoke-RestMethod -Uri "https://content.dropboxapi.com/2/files/upload_session/finish" -Method Post -Headers $finishHeaders
        return $finishRes
    }
}

# Helper to get or create sharing link
function Get-OrCreateSharedLink ($dropboxPath) {
    $uri = "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings"
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    $body = ConvertTo-Json @{
        "path" = $dropboxPath
        "settings" = @{ "requested_visibility" = "public" }
    } -Compress
    
    try {
        $res = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
        return $res.url
    } catch {
        # Check if error is because shared link already exists
        $errText = $_.ErrorDetails.Message
        if ($errText -like "*shared_link_already_exists*") {
            $listUri = "https://api.dropboxapi.com/2/sharing/list_shared_links"
            $listBody = ConvertTo-Json @{
                "path" = $dropboxPath
                "direct_only" = $true
            } -Compress
            $listRes = Invoke-RestMethod -Uri $listUri -Method Post -Headers $headers -Body $listBody
            if ($listRes.links.Count -gt 0) {
                return $listRes.links[0].url
            }
        }
        throw $_
    }
}

function Get-DropboxFileMetadata ($dropboxPath) {
    $uri = "https://api.dropboxapi.com/2/files/get_metadata"
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type" = "application/json"
    }
    $body = ConvertTo-Json @{ "path" = $dropboxPath } -Compress
    try {
        $res = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
        return $res
    } catch {
        return $null
    }
}

function Convert-ToDirectLink ($url) {
    # Replace ?dl=0 with ?raw=1 or &dl=0 with &raw=1
    return $url.Replace("?dl=0", "?raw=1").Replace("&dl=0", "&raw=1")
}

$resultData = @{
    "ugc" = @()
    "videos" = @()
    "static" = @()
}

# FFMPEG path already defined at top

foreach ($catKey in $Categories.Keys) {
    $catInfo = $Categories[$catKey]
    $catDir = Join-Path $FilesDir $catInfo.dirName
    if (-not (Test-Path $catDir)) {
        Write-Warning "Directory $catDir does not exist. Skipping category $catKey."
        continue
    }
    
    Write-Host "Processing category: $catKey (folder: $($catInfo.dirName))...."
    
    $files = Get-ChildItem -Path $catDir -File | Where-Object { $_.Name -ne "desktop.ini" -and $_.Extension -in ".mp4", ".mov", ".png", ".jpg", ".jpeg" }
    
    foreach ($file in $files) {
        $localPath = $file.FullName
        $hash = Get-FileHashString $localPath
        $dropboxPath = "/Files/$($catInfo.dirName)/$($file.Name)"
        
        $directUrl = ""
        $thumbnailUrl = ""
        
        # Step 1: Main file upload/cache lookup
        if ($Cache.ContainsKey($dropboxPath) -and $Cache[$dropboxPath].hash -eq $hash) {
            Write-Host "  File $($file.Name) is cached."
            $directUrl = $Cache[$dropboxPath].directUrl
        } else {
            try {
                $meta = Get-DropboxFileMetadata -dropboxPath $dropboxPath
                if ($null -ne $meta) {
                    Write-Host "  File $($file.Name) already exists on Dropbox. Skipping upload."
                } else {
                    Upload-File -localPath $localPath -dropboxPath $dropboxPath | Out-Null
                }
                
                $sharedLink = Get-OrCreateSharedLink -dropboxPath $dropboxPath
                $directUrl = Convert-ToDirectLink $sharedLink
                
                $Cache[$dropboxPath] = @{
                    "hash" = $hash
                    "dropboxPath" = $dropboxPath
                    "directUrl" = $directUrl
                }
            } catch {
                Write-Error "  Failed to process file $($file.Name): $_"
                continue
            }
        }
        
        # Step 2: Thumbnail generation and upload for videos
        if ($catInfo.isVideo) {
            $thumbName = "$([System.IO.Path]::GetFileNameWithoutExtension($file.Name))_thumb.jpg"
            $localThumbPath = Join-Path $ThumbnailsDir $thumbName
            $dropboxThumbPath = "/Files/$($catInfo.dirName)/thumbnails/$thumbName"
            
            # Generate thumbnail if not exist or parent video changed
            $thumbCachePath = $dropboxThumbPath
            $needThumbGen = $true
            if (Test-Path $localThumbPath) {
                if ($Cache.ContainsKey($thumbCachePath) -and $Cache[$thumbCachePath].parentHash -eq $hash) {
                    $needThumbGen = $false
                }
            }
            
            if ($needThumbGen) {
                Write-Host "  Generating thumbnail for $($file.Name)..."
                try {
                    if (Test-Path $ffmpegPath) {
                        Start-Process -FilePath $ffmpegPath -ArgumentList "-y", "-ss", "00:00:01", "-i", "`"$localPath`"", "-vframes", "1", "-q:v", "2", "`"$localThumbPath`"" -NoNewWindow -Wait
                    } else {
                        Start-Process -FilePath "ffmpeg" -ArgumentList "-y", "-ss", "00:00:01", "-i", "`"$localPath`"", "-vframes", "1", "-q:v", "2", "`"$localThumbPath`"" -NoNewWindow -Wait
                    }
                } catch {
                    Write-Warning "  Could not generate thumbnail using ffmpeg. Direct URL will be used instead."
                }
            }
            
            # Upload thumbnail if generated
            if (Test-Path $localThumbPath) {
                $thumbHash = Get-FileHashString $localThumbPath
                if ($Cache.ContainsKey($thumbCachePath) -and $Cache[$thumbCachePath].hash -eq $thumbHash) {
                    $thumbnailUrl = $Cache[$thumbCachePath].directUrl
                } else {
                    try {
                        $thumbMeta = Get-DropboxFileMetadata -dropboxPath $dropboxThumbPath
                        if ($null -ne $thumbMeta) {
                            Write-Host "  Thumbnail for $($file.Name) already exists on Dropbox. Skipping upload."
                        } else {
                            Upload-File -localPath $localThumbPath -dropboxPath $dropboxThumbPath | Out-Null
                        }
                        
                        $thumbLink = Get-OrCreateSharedLink -dropboxPath $dropboxThumbPath
                        $thumbnailUrl = Convert-ToDirectLink $thumbLink
                        
                        $Cache[$thumbCachePath] = @{
                            "hash" = $thumbHash
                            "parentHash" = $hash
                            "dropboxPath" = $dropboxThumbPath
                            "directUrl" = $thumbnailUrl
                        }
                    } catch {
                        Write-Warning "  Failed to upload thumbnail: $_"
                    }
                }
            }
        }
        
        # Add entry
        $fileObj = [PSCustomObject]@{
            "name" = $file.Name
            "src" = $directUrl
            "thumbnail" = if ($thumbnailUrl) { $thumbnailUrl } else { $directUrl }
            "isVideo" = $catInfo.isVideo
        }
        $resultData[$catKey] += $fileObj
    }
}

# Write Cache and Output Data
$Cache | ConvertTo-Json -Depth 5 | Set-Content -Path $CacheFile -Encoding utf8
$json = $resultData | ConvertTo-Json -Depth 5
Set-Content -Path $OutputDataFile -Value "var portfolioData = $json;" -Encoding utf8

Write-Host "Success! Gallery data written to $OutputDataFile"

# # Automatic Git push to GitHub (Commented out - uncomment to automate)
# Write-Host "Syncing changes to GitHub..."
# try {
#     $gitStatus = git status --porcelain
#     if ($null -ne $gitStatus -and $gitStatus.Trim() -ne "") {
#         Write-Host "  Changes detected. Committing and pushing to GitHub..."
#         git add .
#         git commit -m "Auto-sync portfolio content and code changes"
#         git push origin main
#         Write-Host "  Successfully pushed to GitHub!"
#     } else {
#         Write-Host "  No changes to push to GitHub."
#     }
# } catch {
#     Write-Warning "  Failed to automatically push to GitHub: $_"
# }
