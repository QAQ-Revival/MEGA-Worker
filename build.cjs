const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function build({ upstream = path.join(__dirname, 'vendor/MegaDownloader-Revival'), test = false, output = path.join(__dirname, test ? 'build/test' : 'build/worker'), work = path.join(__dirname, 'build/compiler') } = {}) {
  upstream = path.resolve(upstream);
  output = path.resolve(output);
  work = path.resolve(work);
  const framework = path.join(process.env.WINDIR || 'C:/Windows', 'Microsoft.NET/Framework/v4.0.30319');
  const compiler = path.join(framework, 'vbc.exe');
  if (!fs.existsSync(path.join(upstream, 'Clases/FileDownloader.vb'))) throw Error('Initialize the MegaDownloader-Revival submodule before building');
  if (!fs.existsSync(compiler)) throw Error('.NET Framework VB compiler is required');
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  const sources = ['FileDownloader', 'Criptografia', 'Conexion', 'PreSharedKeyManager', 'URLExtractor', 'MegaFolderHelper',
    'MegaQuotaManager', 'NetworkErrors', 'PathGuard', 'ThrottledStream', 'ThrottledStreamController', 'InternalConfiguration', 'ResourceHelper', 'MEGA_ErrorHandler'];
  const libraries = ['BouncyCastle.Cryptography', 'Newtonsoft.Json', 'System.Memory', 'System.Buffers', 'System.Numerics.Vectors', 'System.Runtime.CompilerServices.Unsafe'];
  for (const name of libraries) fs.copyFileSync(path.join(upstream, 'Resources/DLLs', name + '.dll'), path.join(output, name + '.dll'));
  const args = ['/nologo', '/target:exe', '/optimize+', '/optionstrict+', '/optioninfer+', '/rootnamespace:MegaDownloader', '/main:MegaDownloader.Worker',
    '/imports:Microsoft.VisualBasic,System,System.Collections,System.Collections.Generic,System.Linq,System.Diagnostics',
    `/out:"${path.join(output, 'QAQRMegaWorker.exe')}"`, `/sdkpath:"${framework}"`,
    '/reference:System.dll,System.Core.dll,System.Security.dll,System.Numerics.dll',
    ...libraries.map(name => `/reference:"${path.join(output, name + '.dll')}"`),
    `/resource:"${path.join(upstream, 'Resources/InternalConfig.xml')}",MegaDownloader.InternalConfig.xml`,
    ...sources.filter(name => !test || name !== 'InternalConfiguration').map(name => `"${path.join(upstream, 'Clases', name + '.vb')}"`),
    ...(test ? [`"${path.join(__dirname, 'TestConfiguration.vb')}"`] : []),
    `"${path.join(__dirname, 'Host.vb')}"`, `"${path.join(__dirname, 'Worker.vb')}"`];
  const response = path.join(work, test ? 'test.rsp' : 'compile.rsp');
  fs.writeFileSync(response, args.join('\n'));
  const result = spawnSync(compiler, ['@' + response], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) throw result.error || Error(result.stdout || result.stderr || 'MEGA worker build failed');
  for (const name of ['QAQMMegaWorker.exe', 'QAQMMegaWorker.exe.config', 'source.json']) fs.rmSync(path.join(output, name), { force: true });
  fs.copyFileSync(path.join(__dirname, 'LICENSE'), path.join(output, 'LICENSE'));
  fs.copyFileSync(path.join(upstream, 'LICENSE'), path.join(output, 'LICENSE-Revival.txt'));
  if (fs.existsSync(path.join(upstream, 'NOTICE'))) fs.copyFileSync(path.join(upstream, 'NOTICE'), path.join(output, 'NOTICE-Revival.txt'));
  fs.writeFileSync(path.join(output, 'QAQRMegaWorker.exe.config'), '<?xml version="1.0"?><configuration><startup useLegacyV2RuntimeActivationPolicy="true"><supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.8"/></startup></configuration>');
  console.log('Built MEGA worker' + (test ? ' for testing' : ''));
}

if (require.main === module) {
  const test = process.argv.includes('--test');
  build({ test });
  if (test) {
    const result = spawnSync(process.execPath, ['--test', path.join(__dirname, 'tests/worker.test.cjs')], {
      stdio: 'inherit', windowsHide: true,
      env: { ...process.env, QAQR_MEGA_TEST_EXE: path.join(__dirname, 'build/test/QAQRMegaWorker.exe') }
    });
    if (result.error || result.status !== 0) throw result.error || Error('MEGA worker tests failed');
  }
}
module.exports = { build };
