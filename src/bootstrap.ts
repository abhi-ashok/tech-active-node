import { createConnection } from 'typeorm';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import multer from 'multer';
import {
  uploadCsvData,
  getUserDetail,
  getUserCountForJob,
  getUserDetailCount,
  getJobProfileCount,
  getDuplicateUserCount,
  createDummyUser,
  authenticateToken,
} from './app.controller';

const port = 3100;
const upload = multer({ dest: 'uploads/tmp/csv/' });
const Router = express.Router;
const router = Router();

export async function bootstrap() {
  await createConnection();
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.get('/upload-csv', function (req, res) {
    res.sendFile(path.join(__dirname + '/uploadCsv.html'));
  });
  app.use('/send-csv-data', router);
  router.post('/', upload.single('file'), uploadCsvData);

  app.get('/dummy-user', createDummyUser);
  app.use(authenticateToken);

  app.get('/user-detail/:limit', getUserDetail);
  app.get('/user-detail-count/:jobTitle', getUserCountForJob);
  app.get('/user-detail-count', getUserDetailCount);
  app.get('/job-profile-count', getJobProfileCount);
  app.get('/dup-user-count', getDuplicateUserCount);

  app.listen(port, () => console.log('Listening on port', port));

  return app;
}
