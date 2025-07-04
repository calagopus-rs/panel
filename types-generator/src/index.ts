import { oas31 } from "openapi3-ts";
import { generateTypes } from "./typeGenerator";
import { writeFileSync } from "fs";

fetch("http://localhost:8000/openapi.json")
  .then((res) => res.json())
  .then((spec: oas31.OpenAPIObject) => {
    const types = generateTypes(spec);
    writeFileSync("./types.d.ts", types, "utf-8");
  });
