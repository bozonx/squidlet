
// TODO: наверное задать тип

export default function (masterConfigFilePath: string): {[index: string]: any} {
  if (!masterConfigFilePath) {
    console.error(`You have to specify a "--config" param`);

    process.exit(3);
  }


  // TODO: generate files paths and configs to js object in memory

}
