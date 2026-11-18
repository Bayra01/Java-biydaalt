require('dotenv').config();
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('.env файлд DATABASE_URL болон JWT_SECRET заавал тохируулна уу');
  process.exit(1);
}
const app = require('./app');
const expireJob = require('./jobs/expirePending');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Hotel API: http://localhost:${port}/api/health`);
  expireJob.start();
});
