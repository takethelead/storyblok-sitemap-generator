const axios = require("axios").default;
const fs = require("fs");
const xml = require("xml");
const token = process.env.STORYBLOKPUBLICTOKEN;
const cv = Math.round(new Date().getTime() / 1000);
const per_page = 100;
const page = 1;
const all_links = [];

// Use the system process env if set OR use /export directory
const outputPath = process.env.SITEMAPPATH ? process.env.SITEMAPPATH : "export";

axios
  .get(
    `https://api.storyblok.com/v1/cdn/links?token=${token}&per_page=${per_page}&page=${page}&cv=${cv}`
  )
  .then((res) => {
    // push all links into our all_links variable
    Object.keys(res.data.links).forEach((key) => {
      all_links.push(res.data.links[key]);
    });

    // Check if there are more pages available otherwise thats all to do.
    const total = res.headers.total;
    const maxPage = Math.ceil(total / per_page);
    if (maxPage <= 1) {
      return;
    }

    // Since we know the total we now can pregenerate all requests we need to get all Links
    const contentRequests = [];

    // Store all entrie
    const entries = [];

    // @TODO - Create multiple pages for sites with more than 100 results
    // we will start with page two since the first one is already done.
    //  for (let page = 2; page <= maxPage; page++) {
    //   contentRequests.push(
    //     axios.get(
    //       `https://api.storyblok.com/v1/cdn/links?token=${token}&per_page=${per_page}&page=${page}`
    //     )
    //   );
    // }

    all_links.map((data, index) => {
      // Filter for specific subdirs, if the websites content is located in a subdirectory
      if (data.slug.includes("website/")) {
        entries.push({ url: [{ loc: data.slug }] });
      }
    });

    const xmlFormatter = [
      {
        urlset: [
          {
            _attr: {
              xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
              "xmlns:video":
                "http://www.sitemaps.org/schemas/sitemap-video/1.1",
              "xmlns:image":
                "http://www.sitemaps.org/schemas/sitemap-image/1.1",
            },
          },
          ...entries,
        ],
      },
    ];

    // Create the directory if it's not there yet
    if (!fs.existsSync(outputPath)) {
      // Do something
      fs.mkdir(outputPath, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }

    fs.writeFile(
      outputPath + "/sitemap.xml",
      xml(xmlFormatter, true),
      function (err) {
        if (err) return console.log(err);
        console.log(`SITEMAP exported, entries: ${all_links.length}`);
      }
    );
  })
  .catch(function (thrown) {
    if (axios.isCancel(thrown)) {
      console.log("Request failed", thrown.message);
    } else {
      console.log(thrown.message);
    }
  });
