import React from 'react';

function FilterBar({ dateFilter, setDateFilter, inputValue, setInputValue, uniqueDates }) {
  return (
    <div className="filter-container">
      <div className="form-group">
        <label htmlFor="dateInput">Ngày</label>
        <select
          id="dateInput"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="">Tất cả các ngày</option>
          {uniqueDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="nameInput">Tìm</label>
        <input 
          type="text" 
          id="nameInput" 
          placeholder="VD: Quốc Huy"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
    </div>
  );
}

export default FilterBar;