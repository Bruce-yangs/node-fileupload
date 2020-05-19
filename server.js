const express=require('express')
const bodyParser=require('body-parser')
const multiparty=require('multiparty')
const fse=require('fs-extra')
const fs=require('fs')
const path=require('path')

const app =express()

app.use(express.static(__dirname+'/public'))

app.use(bodyParser.urlencoded({extended:true}))//解析中间件
app.use(bodyParser.json())

// 定义切片上传统一目录
const UPLOAD_DIR=path.resolve(__dirname,'public/upload')

app.post('/upload',function(req,res) {
  const form = new multiparty.Form({uploadDir:'temp'})//定义存储目录'temp'
  form.parse(req);

  form.on('file',async (name,chunk) => {
    // 存放切片的目录
    let chunkDir = `${UPLOAD_DIR}/${chunk.originalFilename.split('.')[0]}`;

    // 如果没有目录就创建

    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }

    //切片再次按 命名规则:    源文件名.index.ext
    var dPath = path.join(chunkDir,chunk.originalFilename.split('.')[1]);

    // 讲切片移动到同名的存放目录
    await fse.move(chunk.path,dPath,{overwrite:true})
    res.send('文件上传成功')

  })

})

// 合并文件
app.post('/merge',async function (req,res) {
  // 获取文件名
  let name = req.body.name;
  let fname = name.split('.')[0];

  // 获取所有文件分片
  let chunDir = path.join(UPLOAD_DIR,fname);//找到对应的分片目录
  let chunks = await fse.readdir(chunDir);// 读取分片

  // 按索引排序
  chunks.sort((a,b) => a-b).map(chunkPath => {
    //合并切片
    fs.appendFileSync(
      path.join(UPLOAD_DIR,name),
      fs.readFileSync(`${chunDir}/${chunkPath}`)
    )
  })
  fse.removeSync(chunDir);
  res.send({msg:'合并成功',url:`http://localhost:3000/upload/${name}`})

})


app.listen(3000)
console.log(' app.listen 3000 ');