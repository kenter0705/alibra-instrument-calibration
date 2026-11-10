// Keep the development server from overwriting the production release directory.
process.env.CALIBRA_BUILD_DIR ||= ".calibra-dev";

const nextCli = require.resolve("next/dist/bin/next");
process.argv = [process.argv[0], nextCli, "dev", ...process.argv.slice(2)];
require(nextCli);
