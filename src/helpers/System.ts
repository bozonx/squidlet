const fs = require('fs');
const helpers = require('./helpers');


export default class System {
  async loadYamlFile(fullPath) {
    const yamlContent = await this.getFileContent(fullPath);

    return helpers.yamlToJs(yamlContent);
  }

  loadYamlFileSync(fullPath) {
    const yamlContent = fs.readFileSync(fullPath, 'utf8');

    return helpers.yamlToJs(yamlContent);
  }

  getFileContent(filename) {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) return reject(err);

        resolve(data);
      });
    });
  }

}
