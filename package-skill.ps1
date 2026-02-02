<#
.SYNOPSIS
    打包Kingscript插件开发Skill为可分发格式

.DESCRIPTION
    将skill目录打包为kingscript-plugin-dev.skill文件
    .skill文件是zip格式的压缩包

.USAGE
    在PowerShell中运行: .\\package-skill.ps1

.OUTPUT
    生成 kingscript-plugin-dev.skill 文件
#>

# 设置参数
$skillName = "kingscript-plugin-dev"
$skillDir = $PSScriptRoot
$outputFile = "$PSScriptRoot\$skillName.skill"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Kingscript插件开发Skill打包工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 检查是否在正确的目录
if (-not (Test-Path "$skillDir\SKILL.md")) {
    Write-Error "错误：未在Skill根目录找到SKILL.md文件"
    Write-Error "请确保在 kingscript-plugin-dev 目录下运行此脚本"
    exit 1
}

# 删除旧的.skill文件（如果存在）
if (Test-Path $outputFile) {
    Write-Host "发现旧的.skill文件，正在删除..." -ForegroundColor Yellow
    Remove-Item $outputFile -Force
    Write-Host "✓ 已删除旧文件" -ForegroundColor Green
}

# 检查7zip是否可用（优先使用，压缩率更高）
$use7zip = $false
if (Get-Command 7z -ErrorAction SilentlyContinue) {
    $use7zip = $true
    Write-Host "检测到7-Zip，将使用7-Zip进行压缩" -ForegroundColor Green
} else {
    Write-Host "未检测到7-Zip，将使用PowerShell自带的Compress-Archive" -ForegroundColor Yellow
    Write-Host "建议安装7-Zip以获得更好的压缩效果" -ForegroundColor Yellow
}

# 准备打包（排除不必要的文件）
$excludePatterns = @(
    "*.skill",
    "package-skill.ps1",
    ".git",
    "node_modules",
    "*.log"
)

Write-Host "`n开始打包Skill..." -ForegroundColor Cyan
Write-Host "Skill名称: $skillName" -ForegroundColor White
Write-Host "打包目录: $skillDir" -ForegroundColor White

if ($use7zip) {
    # 使用7-Zip打包
    $command = "7z a -tzip \"$outputFile\" ."
    Write-Host "命令: $command" -ForegroundColor Gray
    
    # 排除文件
    foreach ($pattern in $excludePatterns) {
        $command += " -xr!$pattern"
    }
    
    Invoke-Expression $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 打包成功！" -ForegroundColor Green
    } else {
        Write-Error "✗ 打包失败"
        exit 1
    }
} else {
    # 使用PowerShell Compress-Archive打包
    try {
        # 获取要打包的文件（排除模式）
        $filesToZip = Get-ChildItem -Path $skillDir -Recurse -File | Where-Object {
            $file = $_.FullName
            $shouldInclude = $true
            
            foreach ($pattern in $excludePatterns) {
                if ($file -like "*$pattern*") {
                    $shouldInclude = $false
                    break
                }
            }
            
            return $shouldInclude
        }
        
        # 获取相对路径
        $relativePaths = $filesToZip | ForEach-Object {
            $relativePath = $_.FullName.Substring($skillDir.Length + 1)
            $relativePath
        }
        
        # 创建压缩包
        Compress-Archive -Path $relativePaths -DestinationPath $outputFile -CompressionLevel Optimal -Force
        
        Write-Host "✓ 打包成功！" -ForegroundColor Green
    } catch {
        Write-Error "✗ 打包失败: $($_.Exception.Message)"
        exit 1
    }
}

# 验证打包结果
if (Test-Path $outputFile) {
    $fileInfo = Get-Item $outputFile
    $fileSize = [math]::Round($fileInfo.Length / 1KB, 2)
    
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "打包完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "文件路径: $outputFile" -ForegroundColor White
    Write-Host "文件大小: $fileSize KB" -ForegroundColor White
    Write-Host "`n检查内容：" -ForegroundColor Cyan
    
    # 列出压缩包内的文件
    if ($use7zip) {
        Write-Host "`n压缩包内容：" -ForegroundColor Yellow
        7z l $outputFile | Select-String -Pattern "SKILL.md|references|scripts" | Select-Object -First 20
    } else {
        Write-Host "（使用7-Zip查看详细内容）" -ForegroundColor Gray
    }
    
    Write-Host "`n✓ Skill可分发文件已生成" -ForegroundColor Green
    Write-Host "  可将此文件分享给其他开发者使用" -ForegroundColor Green
} else {
    Write-Error "✗ 文件未生成"
    exit 1
}

# 提示下一步
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 将 $skillName.skill 文件分发给其他开发者" -ForegroundColor White
Write-Host "2. 其他开发者将此文件放置在skills目录即可使用" -ForegroundColor White
Write-Host "3. 如需更新Skill，修改后重新打包即可" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

exit 0
