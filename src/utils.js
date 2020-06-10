
function extract(string, regexp, errorMessage) {
  const match = string.match(regexp);
  if (match) {
    return match[1];
  }
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

module.exports = { extract };