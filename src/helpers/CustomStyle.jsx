 export const customStyles = {
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white', // fixes transparent dropdown
      zIndex: 9999,
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: 'white', // fixes transparent control box
      borderColor: '#ced4da',   // Bootstrap's default border color
      minHeight: '38px',        // Bootstrap default input height
      boxShadow: 'none',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#212529', // Bootstrap's default text color
    }),
  };