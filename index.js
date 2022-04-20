const axios = require("axios");
const _ = require("lodash");
const fs = require("fs");
const cheerio = require("cheerio");
const XLSX = require("xlsx");

(async () => {
  const list = _.uniqBy(await getAuthorList(100), "username");
  const profiles = await getProfiles(list);
  createXLS(profiles);
})();

function createXLS(profiles) {
  if (profiles && profiles.length) {
    const name = "makersplace";
    let arr = [["Full Name", "Username", "Profile", "Facebook", "Twitter", "Instagram", "Behance", "Website", "Art Station", "Youtube", "Pinterest"]];
    profiles.forEach((obj) => arr.push([obj.fullName, obj.username, obj.facebook, obj.twitter, obj.instagram, obj.behance, obj.website, obj.artstation, obj.pinterest]));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(arr);

    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
    XLSX.writeFile(wb, `${name}.xlsx`);
  }
}

async function getProfiles(list) {
  for (const obj of list) {
    try {
      const result = await axios({
        url: `${obj.profileUrl}about/`,
        method: "GET",
      });
      obj.facebook = getSocialLink(result.data, "facebook");
      obj.twitter = getSocialLink(result.data, "twitter");
      obj.instagram = getSocialLink(result.data, "instagram");
      obj.behance = getSocialLink(result.data, "behance");
      obj.website = getSocialLink(result.data, "website");
      obj.artstation = getSocialLink(result.data, "artstation");
      obj.youtube = getSocialLink(result.data, "youtube_channel");
      obj.pinterest = getSocialLink(result.data, "pinterest");
    } catch (error) {
      console.error(`Profile missing for ${obj.profileUrl}`);
    }
  }
  return list;
}

function getSocialLink(html, site) {
  const $ = cheerio.load(html);
  const node = $(`div[class="external_link ${site}"]`);
  if (node.length && node[0].parentNode && node[0].parentNode.attribs && node[0].parentNode.attribs.href) {
    return node[0].parentNode.attribs.href;
  }
  return "";
}

async function getAuthorList(noOfAuthors) {
  if (noOfAuthors % 25 === 0) {
    const results = [];
    for (let index = 1; index < noOfAuthors / 25 + 1; index++) {
      const startIndex = 25 * (index - 1);
      const result = await requestAuthorList(startIndex);
      results.push(...result);
    }
    return results;
  } else {
    throw new Error("No. of Authors is not divisible by 25");
  }
}

async function requestAuthorList(startIndex = 0) {
  const result = await axios({
    url: "https://makersplace.com/graphql/",
    headers: {
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/json",
      "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-datadog-origin": "rum",
      "x-datadog-parent-id": "3939570798527579785",
      "x-datadog-sampled": "1",
      "x-datadog-sampling-priority": "1",
      "x-datadog-trace-id": "2064674809550318409",
      cookie:
        "csrftoken=hKtjZH12if5RuIATabXZBp8Z66uF7jh0B4T9gCwJ2ejxx3GIkQroH7RNou8aVfzG; sessionid=b2chlsb6inuc5qhgf2vjgn2scl17yq24; __cf_bm=hOu1ByMNwLPk.1yfzziYaejoyAv07VmwkyGE3YodeoA-1650450001-0-AfMylQvvch5DRqFzBzJd/Vk3mBh17L8K632cda5jgT4+ZpReI/WxELImMW218aXBfdNisOkCyci4OjZGIzngWmlRXlf4KmDRkh4rZ2OhKH8AU/Ykl7tpWQaOn6o1Nddp7zV90OInw+IFC8eweGB7K1395oVNLNmlzX/6eprxBRKH; _ga=GA1.2.1558303372.1650450001; _gid=GA1.2.243155058.1650450001; _fbp=fb.1.1650450001166.622673428; __hstc=231162176.2034f9e0d22a30d40c8171fe780d2587.1650450001715.1650450001715.1650450001715.1; hubspotutk=2034f9e0d22a30d40c8171fe780d2587; __hssrc=1; __stripe_mid=a24e0e56-ced1-4a6c-861c-f2cb6a0a0d154661aa; __stripe_sid=63b343dc-4d53-4873-82bf-ba0db88877dfe1a3b6; G_ENABLED_IDPS=google; __hssc=231162176.14.1650450001715; _dd_s=rum=1&id=4dd8fbc4-0031-495b-9f49-968a14fac89c&created=1650450000885&expire=1650451249320",
      Referer: "https://makersplace.com/marketplace/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    method: "POST",
    data: {
      operationName: "DigitalMediaSearch",
      variables: {
        pageSize: 25,
        startIndex,
        sort: ["-popularity_score"],
      },
      query:
        "query DigitalMediaSearch($format: [String!], $lowestAsk: [String], $price: [String!], $reserve: [String!], $offer: [String!], $status: [String!], $editions: [String!], $filter: [String!], $artist: [String!], $userStoreCollectionSlug: String, $owner: [String!], $pageSize: Int, $startIndex: Int, $sort: [String!], $mediaSlug: [String!], $collection: [String!], $collectionTraits: [String!], $collectionTraitsCount: [String!], $tags: [String!]) {\n  marketplace {\n    id\n    digitalMedia(\n      format: $format\n      lowestAsk: $lowestAsk\n      price: $price\n      reserve: $reserve\n      offer: $offer\n      status: $status\n      editions: $editions\n      filter: $filter\n      artist: $artist\n      userStoreCollectionSlug: $userStoreCollectionSlug\n      owner: $owner\n      pageSize: $pageSize\n      startIndex: $startIndex\n      sort: $sort\n      mediaSlug: $mediaSlug\n      collection: $collection\n      collectionTraits: $collectionTraits\n      collectionTraitsCount: $collectionTraitsCount\n      tags: $tags\n    ) {\n      id\n      hasNextPage\n      numUniqueOwners\n      totalResults\n      currentEthRateInUsd\n      collectionTraitCounts {\n        minTraitCount\n        maxTraitCount\n        __typename\n      }\n      collectionInsights {\n        name\n        value\n        unit\n        __typename\n      }\n      collection {\n        id\n        collectionName\n        totalSupply\n        description\n        collectionLogoUrl\n        collectionUrl\n        slug\n        author {\n          hidePublicStorefront\n          __typename\n        }\n        __typename\n      }\n      userStoreCollection {\n        id\n        storeName\n        displayLogoUrl\n        storeUrl\n        description\n        hidePublicStorefront\n        owner {\n          id\n          fullName\n          marketplaceUrl\n          profileImageUrl\n          landingUrl\n          fullLandingUrl\n          availableCreationCount\n          __typename\n        }\n        __typename\n      }\n      isCollectionView\n      isCollectorStore\n      isArtistStore\n      accountType\n      filters {\n        title\n        name\n        options {\n          label\n          value\n          count\n          __typename\n        }\n        isTrait\n        __typename\n      }\n      results {\n        id\n        mediaSlug\n        title\n        description\n        media1000xPreviewContent\n        media500xPreviewContent\n        hasVideo\n        videoUrl\n        totalSupply\n        collaborators {\n          id\n          username\n          fullName\n          marketplaceUrl\n          profileImageUrl\n          landingUrl\n          fullLandingUrl\n          availableCreationCount\n          isFeaturedStore\n          isCollectionAuthor\n          __typename\n        }\n        metadata {\n          height\n          width\n          __typename\n        }\n        drop {\n          id\n          dropsAt\n          hasDropped\n          __typename\n        }\n        product {\n          id\n          lowestAskInUsd\n          lowestAskInEth\n          lastSalePriceInUsd\n          lastSalePriceInEth\n          currentOwner {\n            id\n            fullName\n            username\n            marketplaceUrl\n            profileImageUrl\n            landingUrl\n            fullLandingUrl\n            isFeaturedCollector\n            __typename\n          }\n          hasReservePrice\n          reservePriceMet\n          printEdition\n          productUrl\n          auction {\n            id\n            endsAt\n            auctionEnded\n            __typename\n          }\n          sale {\n            id\n            custodialPriceInUsd\n            __typename\n          }\n          raffle {\n            id\n            startsAt\n            endsAt\n            __typename\n          }\n          liveBid {\n            id\n            bidAmount\n            isEtherBid\n            isCcBid\n            bidInEther\n            bidInUsd\n            __typename\n          }\n          __typename\n        }\n        author {\n          id\n          username\n          fullName\n          marketplaceUrl\n          profileImageUrl\n          landingUrl\n          fullLandingUrl\n          availableCreationCount\n          isFeaturedStore\n          isCollectionAuthor\n          __typename\n        }\n        collection {\n          id\n          collectionName\n          totalSupply\n          description\n          collectionLogoUrl\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    },
  });
  const {
    data: {
      data: {
        marketplace: {
          digitalMedia: { results },
        },
      },
    },
  } = result;
  return results.map((obj) => {
    const {
      author: { fullName, username, fullLandingUrl },
    } = obj;
    return { fullName, username, profileUrl: fullLandingUrl };
  });
}
