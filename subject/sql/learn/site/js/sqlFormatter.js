const sqlKeywords = [
  "SELECT", "INSERT", "UPDATE", "DELETE",
  "CREATE", "ALTER", "DROP", "FROM", "WHERE",
  "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
  "GROUP BY", "ORDER BY", "HAVING", "UNION",
  "AND", "OR", "NOT", "VALUES", "SET", "INTO", "LIKE"
];

export function formatSQL(text) {
  let output = text;

  // 1️⃣ Thêm khoảng trắng trước keyword nếu bị dính với chữ/số trước đó
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(`([^\\s])(${keyword})`, "gi");
    output = output.replace(regex, "$1 $2");
  });

  // 2️⃣ Thêm khoảng trắng sau keyword nếu bị dính với chữ/số ngay sau
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})([^\\s])`, "gi");
    output = output.replace(regex, "$1 $2");
  });

  // 3️⃣ Xuống dòng trước các keyword chính để format đẹp
  const mainKeywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "GROUP BY", "ORDER BY", "HAVING"];
  mainKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
    output = output.replace(regex, `\n$1`);
  });

  // 4️⃣ Xóa khoảng trắng thừa đầu dòng
  output = output.replace(/\n\s+/g, "\n");

  return output.trim();
}
