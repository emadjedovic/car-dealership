const express = require('express');
const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const router = express.Router();

// middleware to parse data
router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

//pocetna stranica (html)
router.get('/', (req,res) => {
  const filePath = path.join(__dirname, '/../views/index.html');
  res.sendFile(filePath);
})

//poziv procedure
router.post('/automobiliSKarakteristikama', (req, res) => {
  //parametar koji prosljedjujemo proceduri
  const string_karakteristike = req.body.karakteristike; //ovo karakteristike su iz input fielda

  baza.query('CALL AutomobiliSKarakteristikama(?)', [string_karakteristike], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Assuming your stored procedure returns a result set, you can send it back
    const resultData = result[0]; //javascript objekat, kasnije treba stringify

    //putanja
    const filePath = path.join(__dirname, '/../views/automobiliSKarakteristikama.ejs');
    //res.sendFile(filePath); izbacujemo ovo

    // Render EJS template and send it
    ejs.renderFile(filePath, { resultData }, (err, html) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send(html);
    });
  });
})

//select poziv, generise html
router.get('/kartonAutomobila', (req, res) => {
  const automobil_id = req.query.automobil_id; //iz forme

  baza.query('SELECT * FROM projekat_automobil WHERE automobil_id = ?', [automobil_id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (result.length === 0) {
      res.status(404).send('Car not found.');
      return;
    }

    const carDetails = result[0]; //objekat, treba stringify u html

    //putanja
    const filePath = path.join(__dirname, '/../views/kartonAutomobila.ejs');

    // Render EJS template and send it
    ejs.renderFile(filePath, { carDetails }, (err, html) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.send(html);
    });
  });
});

router.post('/unosDokumenta', (req, res) => {
  const { sifra_dokumenta, datum, godina, sifra_vrsta_dok, broj_dokumenta, status_dokumenta, broj_referentnog_dokumenta, napomena, sifra_kupca, jsonDataDocument, jsonDataStavke } = req.body;

  // Parse JSON data from the request body
  const documentData = JSON.parse(jsonDataDocument);
  const stavkeData = JSON.parse(jsonDataStavke);

  // Begin transaction for atomicity
  baza.beginTransaction(function (err) {
    if (err) throw err;

    // Insert into projekat_dokument
    baza.query(
        'INSERT INTO projekat_dokument (sifra_dokumenta, datum, godina, sifra_vrsta_dok, broj_dokumenta, status_dokumenta, broj_referentnog_dokumenta, napomena, sifra_kupca) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sifra_dokumenta, datum, godina, sifra_vrsta_dok, broj_dokumenta, status_dokumenta, broj_referentnog_dokumenta, napomena, sifra_kupca],
        function (error, results, fields) {
          if (error) {
            return baza.rollback(function () {
              throw error;
            });
          }

          // Insert into projekat_stavke_dokumenta
          const insertStavkeQuery = 'INSERT INTO projekat_stavke_dokumenta SET ?';
          stavkeData.forEach(stavka => {
            // Add sifra_dokumenta to each stavka object
            stavka.sifra_dokumenta = sifra_dokumenta;

            baza.query(insertStavkeQuery, stavka, function (error, results, fields) {
              if (error) {
                return baza.rollback(function () {
                  throw error;
                });
              }
            });
          });

          // Commit the transaction
          baza.commit(function (err) {
            if (err) {
              return baza.rollback(function () {
                throw err;
              });
            }
            console.log('Transaction Complete.');
            res.status(200).send('Transaction complete.');
          });
        }
    );
  });
});

function handleFile() {
  const fileInputDocument = document.getElementById('jsonDokument');
  const fileInputStavke = document.getElementById('jsonStavke');

  // Handle file input for Document JSON
  const fileDocument = fileInputDocument.files[0];
  if (fileDocument) {
    const readerDocument = new FileReader();
    readerDocument.onload = function (e) {
      const jsonDataDocument = e.target.result;
      console.log(jsonDataDocument);
      // You can process jsonDataDocument as needed
    };
    readerDocument.readAsText(fileDocument);
  }

  // Handle file input for Stavke JSON
  const fileStavke = fileInputStavke.files[0];
  if (fileStavke) {
    const readerStavke = new FileReader();
    readerStavke.onload = function (e) {
      const jsonDataStavke = e.target.result;
      console.log(jsonDataStavke);
      // You can process jsonDataStavke as needed
    };
    readerStavke.readAsText(fileStavke);
  }
}

module.exports = router;