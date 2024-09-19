const jwt = require("jsonwebtoken");
const express = require('express');
const cors = require('cors');

require("dotenv").config();

const JWT_SECRET = "JWT_SECRET";

async function getGoogleSheetsAccessToken() {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 3600
    const jwtToken = jwt.sign(
        {
            iss: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT,
            scope: "https://www.googleapis.com/auth/spreadsheets",
            aud: "https://accounts.google.com/o/oauth2/token",
            exp,
            iat,
        },
        process.env.GOOGLE_SHEETS_PRIVATE_KEY,
        { algorithm: "RS256" },
    )
    const { access_token } = await fetch(
        "https://accounts.google.com/o/oauth2/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type:
                "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwtToken,
            }),
        },
    ).then((response) => response.json());
    return access_token
}

const run = async(val) =>{
    const accessToken = await getGoogleSheetsAccessToken();
    let range = process.env.GOOGLE_SHEETS_SUBSCRIBERS_PAGE
    // const rangeToUpdate = `${range}!A`;

    await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_SUBSCRIBERS_ID}/values/${process.env.GOOGLE_SHEETS_SUBSCRIBERS_PAGE}:append?valueInputOption=USER_ENTERED`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
            range,
            values: val,
            }),
        },
    )
}

const app = express();

// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let corseConfig = {
    origin: '*', // Adjust as necessary
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corseConfig));
app.options("", cors(corseConfig))

const port = 3000;

app.post('/', async function(req, res) {
    let { rlt } = req.body;
    let currentdate = Date();
    rlt.unshift([
        currentdate    
    ]);
    await run(rlt);
    res.status(200).send({message:"Saved successfully"});
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});