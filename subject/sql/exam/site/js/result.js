

// Khi run SQL thì ghi vào runResult
export function showRunResult(html) {
  document.getElementById("runResult").innerHTML = html;
}

// Khi muốn hiển thị kết quả mẫu thì ghi vào sampleResult
export function showSampleResult(html) {
  document.getElementById("sampleResult").innerHTML = html;
}

export function clearResult() {
  document.getElementById("runResult").innerHTML = 'Kết quả sẽ hiển thị ở đây...';
}


