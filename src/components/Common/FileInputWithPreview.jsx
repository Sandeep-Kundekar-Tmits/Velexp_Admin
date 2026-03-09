import React, { useState } from 'react';
import { FormGroup, Label, Input, Button } from 'reactstrap';

const FileInputWithPreview = ({ 
  label, 
  existingFile, 
  onFileChange, 
  accept = '*',
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState(existingFile ? existingFile.name : '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      onFileChange(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileName('');
    onFileChange(null);
  };

  return (
    <FormGroup>
      {label && <Label>{label}</Label>}
      
      <div className="d-flex align-items-center mb-2">
        {fileName ? (
          <>
            <span className="mr-2">{fileName}</span>
            <Button 
              color="danger" 
              size="sm" 
              onClick={clearFile}
              disabled={disabled}
            >
              Remove
            </Button>
          </>
        ) : (
          <span className="text-muted">No file selected</span>
        )}
      </div>
      
      <Input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        disabled={disabled}
      />
      
      {existingFile && !selectedFile && (
        <div className="mt-2">
          <small className="text-muted">Current file: {existingFile.name}</small>
        </div>
      )}
    </FormGroup>
  );
};

export default FileInputWithPreview;