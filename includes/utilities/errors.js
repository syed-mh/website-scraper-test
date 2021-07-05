module.exports = {
  CREATING_DIRECTORY: (ERROR, DIRECTORY) =>
    `Error creating directory <${DIRECTORY}>: ${ERROR}`,
  CREATING_FILE: (ERROR, FILENAME) =>
    `Error creating file <${FILENAME}>: ${ERROR}`,
};
