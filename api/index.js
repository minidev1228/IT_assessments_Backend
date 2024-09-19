const jwt = require("jsonwebtoken");
const express = require('express');
const cors = require('cors');

require("dotenv").config();

const JWT_SECRET = "JWT_SECRET";

const GOOGLE_SHEETS_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqBRm/8rUyRuzm\nDV5C/OkDLjFqpZXoaUt/yechwLL5BO4coo61XCoi2Owz00XI9NekN/W6FR127VN/\neOD5U3dFFYS/M1nURt1F8/0uqYyLh9Wd4rMwY3FbmcbvjVqisrLUGWU7UCc91D32\nEMERqM9pUrq6Nt8nAgPC2JVdLH6WkgLvdSh7O1/REFMD42cxfPAXzOnFmGXidFbJ\nOpAM/DC2yebgKfGJcEtmPuGIXNTIQgYy2KLFYE9qFhHrCah7R1Lqu/DJsBf//xgO\nhJ+0FwY91CJuVHeufiH2Vd2aHMzvr8MWkju66Zqh5L02VgHzUcNUATcftMlIHg2m\n4aHpkbxxAgMBAAECggEAIiVIGJ67+U75QPKqXbXBblwWnJ6IztZmzVFVVBgJWa29\nzI5xLsdFxx3dwkLKHyPdMyPx+99FvZ7ISC+Urz4uE/fQYz4C6nkY83WfAYIXseYj\n5sOizTMLjyQBKhcvfsF43NQE2rasSuSXVRXkUJGgpjxxN/jRNFpZOwaYaNAI1GBG\nzCTMcSzNd5NGjqDmYIGX89RJ5zhE6cM3C1ydWc2ZqnYExqQRFjHbysDdBo6XnNer\n5qDANBYD1UJVDfJKsdseK+oLKJ4k7uMuC17InVYIgkBI9VZETYYF5JT3Dhz4Rh5b\n5Luqa3DPyXPvPau0jTzv/1ixxkJbNDVVoKW5Of8qaQKBgQDZTVMZmZwSS8nYvsay\ndqbmHunFLt7/+3LfDCKRqntP4EnBFEdNuFga1yMBGOmwLBTK0Gy3GEY8gS9dDSrL\nmjjJG9qHivUVu4Cz2ChVcomtOT3XC2O3EfLux0GR0gFOwobkoZXrf9BgfwdReIrU\n6x7i+cjFVojeSOUk9oDp5WC4fwKBgQDITDYKkGAKBaFiTzyVlSSHqz0Ls9FljTjs\nWWZm5ozKvdgddYLfrbdUS8ykWKlxpI3YQwRGc8JbMyhm+9YPGJIO50Q8G7vzgSLr\ndNtCb1MeHjTnk6h7w0gb6PcM5gVZ8ICgd99tYl0LaY0oLhRDsTqD/6XtAIYFPk6y\nMMyDRgqTDwKBgDOK9NAYsH1ifrErp0PDgxkIchi0Ym7DfN7NKRH2JyOuJrBml/cm\nZ7eOGh5zg1KnUhM9VtwjJN3LIqnmqqT6oseJFM+btUB/ZirCdea2sVNmRXXRnMha\nuI3Ms4/cCTVeTNLERSRD//AzkU/Q0NVqI7xg1S+BtBtNnRSkZ7WTE9sPAoGAUHou\njHgN3nj8qt9jXEacctZepMEPNVpUsMIK3vVrRFqa5ts8Rlsp+fiqtK3bBwoy492p\nbhU81h/r79Tn4RDiPpK1W+FY1zHfsfM11a+dGdDROOqfG3sPEge8m7YgGE8Fn3QK\nlYycDeXPDYHWKoyfEkI5jMxVDO5H+FibE3Ok9AkCgYEAt+1nP1s0WJ8G217TqYIX\n40NPlIWKGUpIbYxJW7VMF2x0sjFPglgfieRndiqiCr1y/+zPsBp5hLkV+XVsHo35\nhG+9wXcX25mvTux5YXfdcNnJT8grwISqToGUS8NWKxOLm6hojppWr+W/o3gzMPNr\nCD705zduMTPE4zYhqZ2jXpM=\n-----END PRIVATE KEY-----\n"
const GOOGLE_SHEETS_SERVICE_ACCOUNT = "itass-739@itassessments2024.iam.gserviceaccount.com"
const GOOGLE_SHEETS_SUBSCRIBERS_ID = "19R2XiKl-Bo0O7w_-X1FRvby61kqlqC7quC6ZBskGQaA"
const GOOGLE_SHEETS_SUBSCRIBERS_PAGE = "Sheet1!A:J"

async function getGoogleSheetsAccessToken() {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 3600
    const jwtToken = jwt.sign(
        {
            iss: GOOGLE_SHEETS_SERVICE_ACCOUNT,
            scope: "https://www.googleapis.com/auth/spreadsheets",
            aud: "https://accounts.google.com/o/oauth2/token",
            exp,
            iat,
        },
        GOOGLE_SHEETS_PRIVATE_KEY,
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
    let range = GOOGLE_SHEETS_SUBSCRIBERS_PAGE
    // const rangeToUpdate = `${range}!A`;

    await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SUBSCRIBERS_ID}/values/${GOOGLE_SHEETS_SUBSCRIBERS_PAGE}:append?valueInputOption=USER_ENTERED`,
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
app.get('/', async function(req, res) {
    console.log("Server is working");
    res.status(200).send({message:"server is rnning!"});
})
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