const createResponse = require('./helpers/createResponse');
const getUserIdByLogin = require('./helpers/getUserIdByLogin');
const getUserById = require('./helpers/getUserById');
const decryptPassword = require('./helpers/decryptPassword');
const generateLoginReponse = require('./helpers/generateLoginResponse');

module.exports = async (login = null, password = null) => {
  const normalizedLogin = login?.trim?.();

  if(!normalizedLogin) 
    return createResponse(400, { errorMessage: `Login required` });

  if(!password) 
    return createResponse(400, { errorMessage: `Password required` });

  const userId = await getUserIdByLogin(normalizedLogin);

  if(!userId) 
    return createResponse(401, { errorMessage: `Invalid login or password` });

  const user = await getUserById(userId);

  if(!user) 
    return createResponse(401, { errorMessage: `Invalid login or password` });

  const decryptedPassword = await decryptPassword(user.password);

  if(decryptedPassword !== password) 
    return createResponse(401, { errorMessage: `Invalid login or password` });

  return createResponse(
    200, 
    await generateLoginReponse(userId, user.subscriptionPlan)
  );
};