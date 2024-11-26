// import DOMPurify from 'dompurify';
// import { marked } from 'marked';

const inputPrompt = document.body.querySelector("#input-prompt");
const buttonPrompt = document.body.querySelector("#button-prompt");
const buttonReset = document.body.querySelector("#button-reset");
const elementResponse = document.body.querySelector("#response");
const elementLoading = document.body.querySelector("#loading");
const elementError = document.body.querySelector("#error");
const sliderTemperature = document.body.querySelector("#temperature");
const sliderTopK = document.body.querySelector("#top-k");
const labelTemperature = document.body.querySelector("#label-temperature");
const labelTopK = document.body.querySelector("#label-top-k");
const fileUpload = document.querySelector("#file-upload");
const fileButton = document.querySelector("#button-csv");
const sumaryText = document.querySelector("#summary");
const insightText = document.querySelector("#insight");
const ElementChart = document.querySelector("#chart");
const WritingLoading = document.body.querySelector("#writing");
const SummaryWord = document.body.querySelector("#summaryText");
const InsightWord = document.body.querySelector("#InsightText");






let session;

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      session = await ai.languageModel.create(params);
    }
    console.log(prompt, "prompt");
    let temp_cunk;
    const stream = session.promptStreaming(prompt);
    for await (const chunk of stream) {
      console.log(chunk, "chunk");
      temp_cunk = chunk;
      showResponse(chunk);
      show(WritingLoading);
    }
    console.log("return complete");
    return temp_cunk;
    // return session.prompt(prompt);
  } catch (e) {
    console.log("Prompt failed");
    console.error(e);
    console.log("Prompt:", prompt);
    // Reset session
    reset();
    throw e;
  }
}

async function reset() {
  if (session) {
    session.destroy();
  }
  session = null;
}




const { jsPDF } = window.jspdf;

document.getElementById("download").addEventListener("click", () => {
  const element = document.getElementById("report");

  if (element) {
    console.log("Element found, capturing canvas...");

    // Render the element using html2canvas
    html2canvas(element, { scale: 2, useCORS: true })
      .then((canvas) => {
        console.log("Canvas created successfully!");

        const imgData = canvas.toDataURL("image/png");

        // Initialize jsPDF
        const pdf = new jsPDF("p", "mm", "a4");

        // Get the width of the page and calculate the height
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Set imgWidth and imgHeight as let to allow reassignment
        let imgWidth = pdfWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If the height is greater than the page height, scale it down
        if (imgHeight > pdfHeight) {
          const scaleFactor = pdfHeight / imgHeight;
          imgHeight = pdfHeight;
          imgWidth = imgWidth * scaleFactor;
        }

        // Add the rendered image to the PDF
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        // Save the PDF
        pdf.save("report.pdf");
        console.log("PDF saved!");
      })
      .catch((error) => {
        console.error("Error generating canvas:", error);
      });
  } else {
    console.error("Element not found!");
  }
});







async function initDefaults() {
  if (!("aiOriginTrial" in chrome)) {
    showResponse("Error: chrome.aiOriginTrial not supported in this browser");
    return;
  }
  const defaults = await ai.languageModel.capabilities();
  console.log("Model default:", defaults);
  if (defaults.available !== "readily") {
    showResponse(
      `Model not yet available (current state: "${defaults.available}")`
    );
    return;
  }
  sliderTemperature.value = defaults.defaultTemperature;
  // Pending https://issues.chromium.org/issues/367771112.
  // sliderTemperature.max = defaults.maxTemperature;
  if (defaults.defaultTopK > 3) {
    // limit default topK to 3
    sliderTopK.value = 3;
    labelTopK.textContent = 3;
  } else {
    sliderTopK.value = defaults.defaultTopK;
    labelTopK.textContent = defaults.defaultTopK;
  }
  sliderTopK.max = defaults.maxTopK;
  labelTemperature.textContent = defaults.defaultTemperature;
}

initDefaults();

buttonReset.addEventListener("click", () => {
  hide(elementLoading);
  hide(elementError);
  hide(elementResponse);
  hide(WritingLoading);
  reset();
  buttonReset.setAttribute("disabled", "");
});

sliderTemperature.addEventListener("input", (event) => {
  labelTemperature.textContent = event.target.value;
  reset();
});

sliderTopK.addEventListener("input", (event) => {
  labelTopK.textContent = event.target.value;
  reset();
});

inputPrompt.addEventListener("input", () => {
  if (inputPrompt.value.trim()) {
    buttonPrompt.removeAttribute("disabled");
  } else {
    buttonPrompt.setAttribute("disabled", "");
  }
});
// file handle
fileButton.addEventListener("click", async () => {
  let file = fileUpload.files[0]; // Get the selected file

  if (file) {
    const reader = new FileReader(); // Create a FileReader instance

    reader.onload = async function (e) {
      const csvText = e.target.result; // Get the file content as text
      const cleanedText = parseCSV(csvText); // Clean and parse the CSV
      console.log(cleanedText); // Log the cleaned text
      const prompt = ` summarize and genrate insight and put both data in json format like that : json {summany: " ..", insight: "...", graph: {x:[ ...], y: [...] }} and see if there is any data that can be ploated on a bar graph and, y axis is always numbers, dont give anything other than one json object please only return json object this is a strict requrement,  keep it short in less than 200 words. this is the text :${cleanedText}`;
      showLoading();
      try {
        const params = {
          systemPrompt: "You are a helpful and friendly assistant",
          temperature: sliderTemperature.value,
          topK: sliderTopK.value,
        };
        const response = await runPrompt(prompt, params);
        console.log("response from runPrompt return ", response);
        // json filter code
        const jsonString = response.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonString);
        console.log(data?.summary, "sumary after json filter");
        console.log(data?.insight, "insight after json filter");
        console.log(data?.graph.x, "data for graph after json filter");

        showSummary(data?.summary);
        showInsight(data?.insight)
        showChart(data?.graph)
        hide(WritingLoading);
        showResponse(response);
      } catch (e) {
        showError(e);
      }
    };

    reader.readAsText(file); // Read the file as text
  } else {
    console.log("No file selected");
    alert("No file selected ")
  }
});

function parseCSV(csvText) {
  const rows = csvText.split("\n"); // Split the CSV content into rows
  // Join each row, remove extra spaces, and combine them into a single string
  const result = rows
    .map((row) => row.trim()) // Trim spaces from each row
    .filter((row) => row.length > 0) // Remove empty rows
    .join(" "); // Join all rows into a single string with spaces in between
  return result;
}

buttonPrompt.addEventListener("click", async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const params = {
      systemPrompt: "You are a helpful and friendly assistant.",
      temperature: sliderTemperature.value,
      topK: sliderTopK.value,
    };
    const response = await runPrompt(prompt, params);
    console.log("response from runPrompt return ", response);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

function showLoading() {
  buttonReset.removeAttribute("disabled");
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  elementResponse.innerHTML = response;
  // elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}
function showSummary(response) {
  hide(elementLoading);
  show(sumaryText);
  show(SummaryWord)
  sumaryText.innerHTML = response;
  // elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}
function showInsight(response) {
  hide(elementLoading);
  show(insightText);
  show(InsightWord);
  insightText.innerHTML = response;
  // elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}
function showChart(response) {
  hide(elementLoading);
  show(ElementChart);
  var options = {
    chart: {
        type: 'bar',
        height: 350,
        width: '100%'
        
    },
    series: [{
        name: 'Y',
        data: response.y
    }],
    xaxis: {
        categories: response.x
    },
    plotOptions: {
        bar: {
            columnWidth: '50%'
        }
    },
    colors: ['#4CAF50', '#FF5722', '#2196F3']
};

var chart = new ApexCharts(ElementChart, options);
chart.render();
  // elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}


function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute("hidden");
}

function hide(element) {
  element.setAttribute("hidden", "");
}
