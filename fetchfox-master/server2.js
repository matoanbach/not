import axios from "axios";
import * as cheerio from "cheerio";
import { HttpStatusCode } from "axios";

const url = "https://blog.redplanetlabs.com/author/nathanmarzrpl/";
const data = await axios.get(url);

if (data.status === HttpStatusCode.Ok) {
  const $ = cheerio.load(data.data);
  const menu_primary_container = $(".menu-primary-container");
  const output = menu_primary_container.children("ul").text();

  console.log(output);
}
