// routes/rajaOngkir.js
const express = require("express");
const router = express.Router();
const https = require("https");
const querystring = require("querystring");

// Fungsi untuk membuat permintaan ke Raja Ongkir
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const result = JSON.parse(data);
          if (result.rajaongkir && result.rajaongkir.status && result.rajaongkir.status.code === 200) {
            resolve(result);
          } else {
            // Jika Raja Ongkir mengembalikan error
            reject(result.rajaongkir.status.description || "Error from Raja Ongkir");
          }
        } catch (error) {
          reject("Error parsing response");
        }
      });
    });

    request.on("error", () => {
      reject("Failed to connect to Raja Ongkir");
    });

    if (postData) {
      request.write(postData);
    }
    request.end();
  });
};

// Endpoint untuk mendapatkan ongkir
router.post("/getShippingOptions", async (req, res) => {
  const { origin, destination, weight, courier, destinationType, originType } =
    req.body;

  const postData = querystring.stringify({
    origin,
    destination,
    weight,
    courier,
    destinationType,
    originType,
  });

  const options = {
    hostname: "pro.rajaongkir.com",
    path: "/api/cost",
    method: "POST",
    headers: {
      key: `${process.env.RAJA_ONGKIR_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  try {
    const result = await makeRequest(options, postData);
    const shippingCosts = result.rajaongkir.results;

    // Cek apakah ada data pengiriman yang tersedia
    if (shippingCosts && shippingCosts.length > 0) {
      res.status(200).json({
        success: true,
        data: shippingCosts,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No shipping options found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
});

router.get("/getCouriers", (req, res) => {
  const couriers = ["jne", "pos", "tiki", "anteraja"]; // Tambahkan kurir yang didukung
  res.status(200).json({
    success: true,
    data: couriers,
  });
});


router.post("/checkWaybill", async (req, res) => {
  const { waybill, courier } = req.body;

  if (!waybill || !courier) {
    return res.status(400).json({
      success: false,
      message: "Waybill and courier are required",
    });
  }

  const postData = querystring.stringify({
    waybill,
    courier,
  });

  const options = {
    hostname: "pro.rajaongkir.com",
    path: "/api/waybill",
    method: "POST",
    headers: {
      key: `${process.env.RAJA_ONGKIR_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  try {
    const result = await makeRequest(options, postData);
    const trackingData = result.rajaongkir.result;

    res.status(200).json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
});


// Endpoint untuk melakukan pengecekan tarif
router.post("/checkRates", async (req, res) => {
  const { origin, destination, weight, courier, destinationType, originType } =
    req.body;

  const postData = querystring.stringify({
    origin,
    destination,
    weight,
    originType,
    destinationType,
    courier,
  });

  const options = {
    hostname: "pro.rajaongkir.com",
    path: "/api/cost",
    method: "POST",
    headers: {
      key: `${process.env.RAJA_ONGKIR_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData), // Gunakan Buffer.byteLength
    },
  };

  try {
    const result = await makeRequest(options, postData);
    const rates = result.rajaongkir.results;

    // Cek apakah ada tarif yang tersedia
    if (rates && rates.length > 0) {
      res.status(200).json({
        success: true,
        data: rates,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No rates found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
});

// Endpoint untuk mendapatkan daftar provinsi
router.get("/getProvinces", async (req, res) => {
  const options = {
    hostname: "pro.rajaongkir.com",
    path: "/api/province",
    method: "GET",
    headers: {
      key: `${process.env.RAJA_ONGKIR_API_KEY}`,
    },
  };

  try {
    const result = await makeRequest(options);
    const provinces = result.rajaongkir.results;

    // Cek apakah ada data provinsi
    if (provinces && provinces.length > 0) {
      res.status(200).json({
        success: true,
        data: provinces,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No provinces found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
});

// Endpoint untuk mendapatkan daftar kota
router.get("/getCities/:provinceId", async (req, res) => {
  const provinceId = req.params.provinceId;

  const options = {
    hostname: "pro.rajaongkir.com",
    path: `/api/city?province=${provinceId}`,
    method: "GET",
    headers: {
      key: `${process.env.RAJA_ONGKIR_API_KEY}`,
    },
  };

  try {
    const result = await makeRequest(options);
    const cities = result.rajaongkir.results;

    // Cek apakah ada data kota
    if (cities && cities.length > 0) {
      res.status(200).json({
        success: true,
        data: cities,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No cities found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error || "Something went wrong",
    });
  }
});

module.exports = router;
