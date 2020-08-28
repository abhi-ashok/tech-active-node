import * as csv from 'fast-csv';
import fs from 'fs';
import { UserDetail, JobProfile, DuplicateUserDetail, User } from './app.models';
import { LessThan, getManager, MoreThanOrEqual } from 'typeorm';
import moment from 'moment';
import jwt from 'jsonwebtoken';

const noAuthUrls = [
  '/upload-csv',
  '/upload-csv/',
  '/dummy-user',
  '/dummy-user/',
  '/send-csv-data',
  '/send-csv-data',
];

async function getUserDetailDataIndex(rawUserDetail: any[][]) {
  const slIndex = rawUserDetail[0].findIndex(data => data === 'Sl No.');
  const emailIndex = rawUserDetail[0].findIndex(data => data === 'Email Address');
  const nameIndex = rawUserDetail[0].findIndex(data => data === 'FirstName LastName');
  const addressIndex = rawUserDetail[0].findIndex(data => data === 'Address');
  const logIndex = rawUserDetail[0].findIndex(data => data === 'Activity Log');
  const dobIndex = rawUserDetail[0].findIndex(data => data === 'Date of Birth');
  return { slIndex, emailIndex, nameIndex, addressIndex, logIndex, dobIndex };
}

async function createDuplicateUserData(oldData: UserDetail, newData: UserDetail) {
  let duplicateUserDetail = new DuplicateUserDetail();
  duplicateUserDetail = Object.assign(duplicateUserDetail, oldData);
  duplicateUserDetail.userDetail = newData;
  delete duplicateUserDetail.id;
  await getManager().save(duplicateUserDetail);
}

async function insertDataToUserDetail(rawUserDetail: any[][], res) {
  const { slIndex, emailIndex, nameIndex, addressIndex, logIndex, dobIndex } = await getUserDetailDataIndex(rawUserDetail);
  if ([slIndex, emailIndex, nameIndex, addressIndex, logIndex, dobIndex].indexOf(-1) > -1) {
    res.send('Error: Can\'t upload. Incorrect data!');
    console.error('Error: Can\'t upload. Incorrect data!');
    return;
  }

  rawUserDetail = rawUserDetail.slice(1);
  for (let i = 0; i < rawUserDetail.length; i++) {
    const data = rawUserDetail[i];
    const oldUserDetail = await getManager().findOne(UserDetail, {
      emailId: data[emailIndex],
      activityLog: LessThan(data[logIndex]),
    });
    const userDetail = new UserDetail();
    userDetail.id = data[slIndex];
    userDetail.emailId = data[emailIndex];
    userDetail.fullName = data[nameIndex];
    userDetail.address = data[addressIndex];
    userDetail.activityLog = data[logIndex];
    userDetail.dateOfBirth = moment(data[dobIndex], 'M/D/YYYY').format('YYYY-MM-DD');

    if (oldUserDetail) {
      await getManager().delete(UserDetail, oldUserDetail.id);
      const newUserDetail = await getManager().save(userDetail);
      createDuplicateUserData(oldUserDetail, newUserDetail);
      continue;
    }

    let newUserDetail = await getManager().findOne(UserDetail, {
      emailId: data[emailIndex],
      activityLog: MoreThanOrEqual(data[logIndex]),
    });
    if (newUserDetail) {
      createDuplicateUserData(userDetail, newUserDetail);
      continue;
    }
    await getManager().save(userDetail);
  }
}

async function getJobProfileDataIndex(rawJobProfile: any[][]) {
  const idIndex = rawJobProfile[0].findIndex(data => data === 'ID');
  const titleIndex = rawJobProfile[0].findIndex(data => data === 'Job Title');
  const emailIndex = rawJobProfile[0].findIndex(data => data === 'Email Address');
  return { idIndex, titleIndex, emailIndex };
}

async function insertDataToJobProfile(rawJobProfile: any[][], res) {
  const { idIndex, titleIndex, emailIndex } = await getJobProfileDataIndex(rawJobProfile);
  if ([idIndex, titleIndex, emailIndex].indexOf(-1) > -1) {
    res.send('Error: Can\'t upload. Incorrect data!');
    console.error('Error: Can\'t upload. Incorrect data!');
    return;
  }

  rawJobProfile = rawJobProfile.slice(1);
  for (let i = 0; i < rawJobProfile.length; i++) {
    const data = rawJobProfile[i];
    const jobProfile = new JobProfile();
    jobProfile.id = data[idIndex];
    jobProfile.title = data[titleIndex];
    const userDetailWithEmail = await getManager().findOne(UserDetail, { emailId: data[emailIndex] });
    if (userDetailWithEmail) {
      jobProfile.userDetail = userDetailWithEmail;
      await getManager().save(jobProfile);
    }
  }
}

export async function uploadCsvData(req, res) {
  const fileRows = [];
  try {
    csv.parseFile(req.file.path)
      .on('data', (data) => {
        fileRows.push(data);
      })
      .on('end', async () => {
        if (req.body.description === 'User Details' && fileRows[0].length !== 6) {
          res.send('Error: Can\'t upload. Insufficient data!');
          console.error('Error: Can\'t upload. Insufficient data!');
          return;
        }
        if (req.body.description === 'User Details' && fileRows[0].length === 6) {
          insertDataToUserDetail(fileRows, res);
        }
        if (req.body.description === 'Job Profile' && fileRows[0].length !== 3) {
          res.send('Error: Can\'t upload. Insufficient data!');
          console.error('Error: Can\'t upload. Insufficient data!');
          return;
        }
        if (req.body.description === 'Job Profile' && fileRows[0].length === 3) {
          const userDetailCount = await getManager().count(UserDetail);
          if (!userDetailCount) {
            return res.send('Please upload user-detail data first!');
          }
          insertDataToJobProfile(fileRows, res);
        }

        res.send('Sent to upload');
        fs.unlinkSync(req.file.path);
      });
  } catch (error) {
    res.send(`Error in parsing file`);
    console.error(error);
  }
}

export async function createDummyUser(req, res) {
  const userCount = await getManager().count(User);
  let user = new User();
  if (!userCount) {
    user.userName = 'techActiveUser';
    user.password = 'techActiveUser';
    await getManager().save(user);
  }
  user = await getManager().findOne(User, { order: { id: 'ASC' } });
  const token = jwt.sign({ 'username': user.userName }, process.env.TOKEN_SECRET, { expiresIn: '3600s' });
  res.send({ token });
}

export async function authenticateToken(req, res, next) {
  if (noAuthUrls.indexOf(req.path) > -1) return next();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export async function getUserDetail(req, res) {
  const limit = req.params.limit;
  const userDetail = await getManager().find(UserDetail, { take: limit });
  res.send(userDetail);
}

export async function getUserCountForJob(req, res) {
  console.log(req.path)
  const jobTitle = req.params.jobTitle;
  const userDetailCount = await getManager().count(JobProfile, { title: jobTitle });
  res.send({ jobTitle, count: userDetailCount });
}

export async function getUserDetailCount(req, res) {
  const userDetail = await getManager().count(UserDetail);
  res.send({ userDetail });
}

export async function getJobProfileCount(req, res) {
  const jobProfile = await getManager().count(JobProfile);
  res.send({ jobProfile });
}

export async function getDuplicateUserCount(req, res) {
  const duplicateUserDetail = await getManager().count(DuplicateUserDetail);
  res.send({ duplicateUserDetail });
}
