import express, { Application, Request, Response, response } from 'express';
import { create, Whatsapp, Message } from 'venom-bot';
import venom from 'venom-bot';
import { join } from 'path';
import { readFile } from 'fs';
import mime from 'mime'
import { testClient } from './client';


const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let client: Whatsapp | null = null;
let isClientInitialized = false;




app.get('/wpp-check-auth', async (req: Request, res: Response) => {
  const session_name = String(req.query.session_name)
  let isAuthenticated
  try {
    client = await create({
      statusFind: (code) => {
        isAuthenticated = ['isLogged', 'successChat'].includes(code);
      },
      logQR: true,
      updatesLog: false,
      autoClose: 30000,
      devtools: false,
      disableSpins: true,
      disableWelcome: true,
      debug: false,
      forceConnectTime: 1000,
      forceConnect: true,
      headless: 'new',
      puppeteerOptions: {
        timeout: 100,
      },
      session: session_name,
      catchQR: (qrCode: string, asc) => {
        res.status(200).json({
          qrCode,
          connected: false,
        });
      },
    },
    )
    if (isAuthenticated) {
      return res.status(200).json({
        connected: true,
        client
      })
    }
  } catch (error) {
    console.error('Erro ao iniciar o Venom:', error);
    res.status(500).json({ error: error });
    return;
  }



  // desabilitar algumas coisas para performatizar o check auth | gerar qr 6s
  //                                                            | dizer que está conectado 17s
  //                                                            | desabilitar verificação da versão do nodeJS (pendente...)



});


app.post('/wpp-send-message', async (req: Request, res: Response) => {
  const { session_name, fileType, msg } = req.body
  let code
  let isAuthenticated

  try {
    client = await create({
      statusFind: (status) => {
        code = status,
          isAuthenticated = ['isLogged', 'successChat', 'chatsAvailable'].includes(code);
      },
      logQR: false,
      updatesLog: false,
      autoClose: 30000,
      devtools: false,
      disableSpins: true,
      disableWelcome: true,
      debug: false,
      forceConnectTime: 1000,
      forceConnect: true,
      headless: false,
      puppeteerOptions: {
        timeout: 100,
      },
      session: session_name,
    },
    )

    if (isAuthenticated && fileType === 'pdf') {
      readFile('./src/teste.pdf', "base64", async (err, data) => {
        if (err) {
          return console.log(err)
        }

        const base64File = `data:application/pdf;base64,${data}`;
        const response = await client?.sendFileFromBase64('5581997210434@c.us', base64File, 'teste.pdf', 'application/pdf')
        return res.status(200).json({
          response
        })
      })

    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      return res.status(400).json({
        code: "400",
        error: error
      })
    }
    console.error('Erro ao iniciar o Venom:', error);
    res.status(500).json({ error: error });
    return;
  }


})
app.post('/wpp-send-pdf', async (req: Request, res: Response) => {
  const { session_name, fileType, msg } = req.body
  const newClient = testClient
  try {
    if (newClient && fileType === 'pdf') {
      readFile('./src/teste.pdf', "base64", async (err, data) => {
        if (err) {
          return console.log(err)
        }

        const base64File = `data:application/pdf;base64,${data}`;
        const response = await newClient?.sendFileFromBase64('5581997210434@c.us', base64File, 'teste.pdf', 'application/pdf')
        return res.status(200).json({
          response
        })
      })
    }
    console.log("client:", newClient)

  } catch (error) {
    return res.status(400).json({
      code: "404",
      error
    })
  }
})



app.listen(3000, () => console.log('Server is running 🚀')); 