const { createHash } = require("node:crypto");
const { createReadStream } = require("node:fs");
const { readFile, stat, access } = require("node:fs/promises");
const path = require("node:path");
const yaml = require("js-yaml");

async function verifyUpdateRelease(directory, version) {
  const metadata = yaml.load(await readFile(path.join(directory, "latest.yml"), "utf8"));
  const filename = `E-Jamaat-Setup-${version}.exe`;
  if (metadata.version !== version || metadata.path !== filename) {
    throw new Error(`latest.yml must reference the NSIS installer ${filename} for version ${version}.`);
  }
  const files = metadata.files;
  if (!Array.isArray(files) || files.length !== 1 || files[0].url !== filename) {
    throw new Error("latest.yml must contain only the Windows x64 Setup installer, not the portable executable.");
  }
  const installerPath = path.join(directory, filename);
  const info = await stat(installerPath);
  if (info.size !== files[0].size) {
    throw new Error(`Installer size mismatch for ${filename}; the file may have been overwritten.`);
  }
  const hash = createHash("sha512");
  for await (const chunk of createReadStream(installerPath)) hash.update(chunk);
  const checksum = hash.digest("base64");
  if (checksum !== metadata.sha512 || checksum !== files[0].sha512) {
    throw new Error(`Installer SHA-512 mismatch for ${filename}. Do not publish this release.`);
  }
  await access(`${installerPath}.blockmap`);
  return filename;
}

if (require.main === module) {
  const { version } = require("../package.json");
  const tagMismatch = process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${version}`;
  const verification = tagMismatch
    ? Promise.reject(new Error(`Release tag must be v${version} to match package.json.`))
    : verifyUpdateRelease(path.resolve(__dirname, "../dist"), version);
  verification.then((filename) => {
    console.log(`Verified update installer: ${filename}`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { verifyUpdateRelease };
