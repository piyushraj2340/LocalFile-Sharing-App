const fs = require('fs');
const os = require('os');
const path = require('path');

require('./db/db');

const express = require('express');
const fileUpload = require('express-fileUpload');

const app = express();

const fileApp = require('./models/fileAppSchema');

const port = 8000 || process.env.port;
const hostname = "localhost";

const staticPath = path.join(__dirname, "../client");
app.use(express.static(staticPath));

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

function generateUniqueCode() {
    const ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const len = ch.length;
    let result = "";
    for(let i = 0; i < len/2; i++) {
        result += ch[Math.floor(Math.random() * len)];
    }

    return result;
}

function getLocalIp() {
    let network = os.networkInterfaces();
    let localIp = network['Wi-Fi'];
    let ip = localIp[localIp.length - 1].address;

    return ip;
}

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,"client","index.html"));
});

app.get("/fileDownload/:id", async (req,res) => {
    try {
        let id = req.params.id;
        const searchFile = await fileApp.findOne({fileId: id});

        if(searchFile) {
            res.sendFile(path.resolve(path.join(__dirname,'../Temp'),id,searchFile.fileName));
            console.log("File Download");
        } else {
            console.log("No File Found");
            const result = {
                status: false,
                message: "File Not Found"
            }
            res.send(result)
        }
    } catch (error) {
        const result = {
            status: false,
            message: "Error In File Downloading"
        }

        res.send(result);
        console.log(error);
    }
});

app.get('/fileSearch/:id',async (req,res) => {
    try {
        let id = req.params.id;
        const file = await fileApp.findOne({fileId: id});

        if(file) {
            const result =  {
                status: true,
                message: "File Found",
                file,
                link: path.resolve(path.join(__dirname,'../Temp'),id,file.fileName)
            }

            console.log(result);
            res.send(result);
        }else {
            const result =  {
                status: false,
                message: "File Not Found",
            }
            res.send(result);
        }

    } catch (error) {
        const result =  {
            status: false,
            message: "Something Went Wrong!....",
        }
        res.send(result)
        console.log(error);
    }
});

app.post('/fileSend', async (req,res) => {
    // console.log(req.files.file);
    try {
        let code = generateUniqueCode();
        let files = req.files.file;

        console.log(files);

        const saveFile = new fileApp({
            fileName: files.name,
            fileId: code,
            fileExpires: Date.now() + 1000 * 60 * 5
        });

        const file  = await saveFile.save();

        fs.mkdirSync(`./Temp/${code}`);
        files.mv(`./Temp/${code}/${files.name}`, (err) => {
            if(err) {
                console.log(err);
            } else {
                console.log("File Moved!...");
            }
        });
        setTimeout(async() => {
            try {
                await fileApp.deleteOne({fileId: code});
                fs.unlinkSync(`./Temp/${code}/${files.name}`);
                fs.rmdirSync(`./Temp/${code}`);
                console.log("File Removed");
            } catch (fileErr) {
                console.log(fileErr);
            }
        }, 1000 * 60 * 5);

        

        const result = {
            status: true,
            message: "File Saved!....",
            file,
            link: `http://${getLocalIp()}:5000/searchFile/${code}`,
        }
        res.send(result);
        
    } catch (err) {
        const result = {
            status: false,
            message: "Something Went Wrong!..."
        }

        res.send(result);
        console.log(err);
    }
});

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname,"../","client","index.html"));
})

async function removeFile() {
    const file = await fileApp.find();
    let data = file.filter((elem) => {
        return elem.fileExpires < Date.now();
    });

    data.forEach(async (elem) => {
        await fileApp.deleteOne(elem);
        fs.unlinkSync(`./Temp/${elem.fileId}/${elem.fileName}`)
        fs.rmdirSync(`./Temp/${elem.fileId}`);
    });
}

removeFile();

app.listen(port,hostname,() => {
    console.log(`Listing to Local Host:  http://${hostname}:${port}`);
});

app.listen(5000,getLocalIp(), async () => {
    console.log(`Listing To Local Network:  http://${getLocalIp()}:5000`);
});