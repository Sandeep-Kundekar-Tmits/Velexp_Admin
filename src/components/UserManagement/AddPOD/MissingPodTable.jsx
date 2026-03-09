import React from 'react';
import { Table } from 'reactstrap';
import PropTypes from 'prop-types';

const MissingPodTable = ({ data, columns, title, bordered, striped, hover }) => {
  // Function to format date from DD-MM-YYYY to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to format state name consistently
  const formatState = (state) => {
    if (!state) return '';
    return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  };

  return (
    <div className="table-responsive">
      {title && <h4 className="mb-3">{title}</h4>}
      <Table bordered={bordered} striped={striped} hover={hover}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => {
                // Apply formatting based on column key
                let cellContent = item[column.key];
                
                if (column.key === 'Book Date' || column.key === 'Delivery Date') {
                  cellContent = formatDate(item[column.key]);
                } else if (column.key === 'Consignee State') {
                  cellContent = formatState(item[column.key]);
                }
                
                return (
                  <td key={`${index}-${column.key}`}>
                    {column.render ? column.render(item) : cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

MissingPodTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      render: PropTypes.func
    })
  ).isRequired,
  title: PropTypes.string,
  bordered: PropTypes.bool,
  striped: PropTypes.bool,
  hover: PropTypes.bool
};

MissingPodTable.defaultProps = {
  bordered: true,
  striped: true,
  hover: true
};

export default MissingPodTable;