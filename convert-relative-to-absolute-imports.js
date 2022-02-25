const glob = require("glob");
const path = require("path");
const fs = require("fs");

const getShortestAliasPath = (aliases, importAbsolutePath) => {
  const possibleAliasPaths = aliases.map(([alias, aliasPath]) => {
    const relativePathToAlias = path.relative(aliasPath, importAbsolutePath);

    return [alias, relativePathToAlias];
  });

  const [alias, relativePath] = possibleAliasPaths.sort(
    (a, b) => a[1] - b[1]
  )[0];

  const aliasPath = path.join(alias, relativePath);

  return aliasPath.endsWith("/") ? aliasPath : aliasPath + "/";
};

const getAliasImportPath = (aliases, filePath, relativeImport) => {
  const dirPath = path.dirname(filePath);
  const importAbsolutePath = path.resolve(dirPath, relativeImport);

  return getShortestAliasPath(aliases, importAbsolutePath);
};

const replaceRelativeImports = (aliases, filePath, content) => {
  const newContent = content.replace(/from '(\.\.\/){1,}/g, (match) => {
    const relativeImportPath = match.replace(`from '`, "");
    const srcImportPath = getAliasImportPath(
      aliases,
      filePath,
      relativeImportPath
    );

    return `from '${srcImportPath}`;
  });

  return newContent;
};

const processFiles = (cwd) => {
  const aliases = [["@src/", path.join(cwd, "src")]];

  glob(
    path.join(cwd, "./src/**/*.ts"),
    {
      absolute: true,
      cwd,
    },
    function (err, filePaths) {
      filePaths.forEach((filePath) => {
        console.info("Processing: ", filePath);
        const content = fs.readFileSync(filePath, "utf8");
        const newContent = replaceRelativeImports(aliases, filePath, content);
        fs.writeFileSync(filePath, newContent, "utf8");
      });
    }
  );
};

const basePath = process.argv[2];

if (!basePath) {
  console.error("Provide a working dir as an argument!");
  process.exit(1);
}

processFiles(basePath);
