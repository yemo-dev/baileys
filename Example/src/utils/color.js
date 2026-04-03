const wrap = (code) => (value) => `\u001b[${code}m${value}\u001b[0m`

const Color = {
  bold: wrap('1'),
  dim: wrap('2'),
  gray: wrap('90'),
  green: wrap('32'),
  red: wrap('31'),
  cyan: wrap('36'),
  yellow: wrap('33'),
}

export default Color
