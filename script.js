async function processEmail() {
  const text = document.getElementById("emailText").value.trim();
  const file = document.getElementById("emailFile").files[0];

  if (!text && !file)
    return alert("Insira o texto ou faça upload de um arquivo.");

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("result").classList.add("hidden");

  let emailContent = text;

  if (file) {
    if (file.type === "text/plain") {
      emailContent = await file.text();
    } else if (file.type === "application/pdf") {
      emailContent = await readPdf(file);
    } else {
      alert("Formato de arquivo não suportado!");
      document.getElementById("loading").classList.add("hidden");
      return;
    }
  }

  try {
    const formData = new FormData();
    formData.append("text", emailContent);

    const response = await fetch(
      "https://server-py-8doi.onrender.com/classify/",
      { method: "POST", body: formData }
    );
    const data = await response.json();
    const classificacao = JSON.parse(data.classificacao);

    document.getElementById("categoria").textContent = classificacao.categoria;
    document.getElementById("resposta").textContent = classificacao.resposta;
    document.getElementById("result").classList.remove("hidden");
  } catch (error) {
    alert("Erro ao processar o email: " + error);
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
}

async function readPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
