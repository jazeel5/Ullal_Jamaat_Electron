const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { mkdtemp, writeFile, rm } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { verifyUpdateRelease } = require("../scripts/verify-update-release");

test("release validation rejects a portable executable overwriting the setup artifact", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ejamaat-release-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = "E-Jamaat-Setup-1.0.4.exe";
  const installer = Buffer.from("installer contents");
  const sha512 = createHash("sha512").update(installer).digest("base64");
  await writeFile(path.join(directory, filename), installer);
  await writeFile(path.join(directory, `${filename}.blockmap`), "blockmap");
  // JSON is also valid YAML and exercises the same metadata parser.
  const metadata = {
    version: "1.0.4", path: filename, sha512,
    files: [{ url: filename, size: installer.length, sha512 }],
  };
  await writeFile(path.join(directory, "latest.yml"), JSON.stringify(metadata));
  assert.equal(await verifyUpdateRelease(directory, "1.0.4"), filename);

  await writeFile(path.join(directory, filename), "portable");
  await assert.rejects(verifyUpdateRelease(directory, "1.0.4"), /size mismatch/);
  await writeFile(path.join(directory, filename), Buffer.alloc(installer.length));
  await assert.rejects(verifyUpdateRelease(directory, "1.0.4"), /SHA-512 mismatch/);
  await writeFile(path.join(directory, filename), installer);
  metadata.path = "E-Jamaat-Portable-1.0.4.exe";
  await writeFile(path.join(directory, "latest.yml"), JSON.stringify(metadata));
  await assert.rejects(verifyUpdateRelease(directory, "1.0.4"), /NSIS installer/);
});
