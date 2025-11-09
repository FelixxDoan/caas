const tableHeadRow = document.querySelector("#employeeTable thead tr");
const tableBody = document.querySelector("#employeeTable tbody");

// Hàm tạo tiêu đề bảng
function createTableHeaders(fields) {
  fields.forEach((field) => {
    const th = document.createElement("th");
    // Chuyển đổi tên trường thành chuỗi dễ đọc hơn
    th.textContent = field.charAt(0).toUpperCase() + field.slice(1);
    tableHeadRow.appendChild(th);
  });
}

// Hàm tạo các hàng dữ liệu
function createTableRows(rows, fields) {
  rows.forEach((rowData) => {
    const tr = document.createElement("tr");

    // Lặp qua các giá trị của đối tượng rowData để tạo các ô dữ liệu
    for (const field of fields) {
      const td = document.createElement("td");
      let cellData = rowData[field];

      // Xử lý một số trường đặc biệt
      if (field === "birthdate") {
        // Định dạng lại ngày tháng
        const date = new Date(cellData);
        cellData = date.toLocaleDateString();
      }

      td.textContent = cellData;
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  });
}

const closeBtn = document.querySelector(".close-btn");
closeBtn.addEventListener("click", () => {
  document.querySelector(".modal").style.display = "none";
  clearTable();
});

// Đóng modal khi click ra ngoài
window.addEventListener("click", (e) => {
  const modal = document.querySelector(".modal");
  if (e.target === modal) {
    modal.style.display = "none";
    clearTable();
  }
});

const modal = document.querySelector(".modal");
const sqlEditor = modal.querySelector(".sql-editor");
const runBtn = document.querySelector(".run p");

runBtn.onclick = async () => {
  clearTable();

  const sqlText = sqlEditor.value;

  // Tạo Blob từ nội dung SQL
  const sqlBlob = new Blob([sqlText], { type: "text/plain" });

  // Tạo FormData và append blob vào với key là 'sqlFile'
  const formData = new FormData();
  formData.append("sqlFile", sqlBlob, "query.sql"); // đặt tên file là query.sql

  // Gửi fetch đến API
  await fetchData(formData);
};

const API_BASE = "/api";

const fetchData = async (formData) => {
  try {
    const res = await fetch(`${API_BASE}/subject/sql/db/query-default`, {
      method: "POST",
      body: formData,
    });

    const { queries } = await res.json();
    console.log(queries);
    const data = queries[0];
    const { fields, rows } = data;
    createTableHeaders(fields);
    createTableRows(rows, fields);
  } catch (error) {
    console.error("Lỗi khi gửi request:", error);
  }
};

function clearTable() {
  // Xóa tất cả tiêu đề bảng (các <th>)
  tableHeadRow.innerHTML = "";

  // Xóa tất cả các hàng dữ liệu (các <tr>)
  tableBody.innerHTML = "";
}
