# electron-template

使用 Electron 启动桌面程序模板，后台启动服务

## 使用说明

```shell

# 定义应用信息
productName='yourProductName'
version='1.0.0'
publisherName='yourName'
publishProvider='github'
publishOwner='githubOwner'
publishRepo='githubRepo'

# 写入应用信息
echo '{
  "name": "'$productName'",
  "version": "'$version'",\
  "main": "./dist/main/main.js"
}' >  ./release/app/package.json

publish='{
      "provider": "'$publishProvider'",
      "owner": "'$publishOwner'",
      "repo": "'$publishRepo'"
    }
'
# 设置包相关信息
sed -i 's/<productName>/'$productName'/g' ./package.json
sed -i 's/<publisherName>/'$publisherName'/g' ./package.json
sed -i 's/"<publish>"/'$publish'/g' ./package.json

```