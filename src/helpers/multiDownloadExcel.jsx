export const multiDownloadExcel = (sheets, fileName = 'export.xlsx') => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/multiExcelWorker.js', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      const { type, buffer, error } = e.data;
      if (type === 'result') {
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

    worker.postMessage({
      data: sheets,
      fileName
    });
  });
};
