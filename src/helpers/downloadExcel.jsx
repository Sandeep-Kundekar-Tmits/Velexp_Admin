// export const downloadExcel = (data, fileName = 'export.xlsx', sheetName = 'Sheet1', mainHeading = '', onProgress) => {
//   return new Promise((resolve, reject) => {
//     // Create a new worker
//     const worker = new Worker(new URL('../workers/excelWorker.js', import.meta.url), {
//       type: 'module'
//     });

//     worker.onmessage = (e) => {
//       const { type, buffer, error, fileName: resultFileName } = e.data;

//       if (type === 'result') {
//         // Create and trigger download
//         const blob = new Blob([buffer], {
//           type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = resultFileName;
//         document.body.appendChild(link);
//         link.click();

//         setTimeout(() => {
//           document.body.removeChild(link);
//           URL.revokeObjectURL(url);
//           worker.terminate();
//           resolve();
//         }, 100);
//       } else if (type === 'error') {
//         worker.terminate();
//         reject(new Error(error));
//       }
//     };

//     worker.onerror = (error) => {
//       worker.terminate();
//       reject(error);
//     };

//     // Send data to worker
//     worker.postMessage({
//       data,
//       fileName,
//       sheetName,
//       mainHeading
//     });
//   });
// };

export const downloadExcel = (data, fileName = 'export.xlsx', sheetName = 'Sheet1', mainHeading = '', onProgress) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/excelWorker.js', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      const { type, buffer, error } = e.data;
      if (type === 'result') {
        // Create and trigger download
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          worker.terminate();
          resolve();
        }, 100);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    // Send data to worker
    worker.postMessage({
      data,
      fileName,
      sheetName,
      mainHeading
    });
  });
};