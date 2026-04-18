import React, { useCallback } from 'react';
import './PriceRangeSlider.css';

const formatPrice = (price) => {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + 'K';
  }
  return price.toString();
};

const PriceRangeSlider = ({ min = 0, max = 50000000, values, onChange, label = 'Price Range' }) => {
  const [minVal, maxVal] = values;

  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  const handleMinChange = (e) => {
    const val = Math.min(Number(e.target.value), maxVal - 500000);
    onChange([val, maxVal]);
  };

  const handleMaxChange = (e) => {
    const val = Math.max(Number(e.target.value), minVal + 500000);
    onChange([minVal, val]);
  };

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className="price-slider">
      <div className="price-slider-label">{label}</div>
      <div className="price-slider-values">
        <span>{formatPrice(minVal)} ₫</span>
        <span>{formatPrice(maxVal)} ₫</span>
      </div>
      <div className="price-slider-track-container">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          className="price-slider-thumb price-slider-thumb--left"
          step={100000}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          className="price-slider-thumb price-slider-thumb--right"
          step={100000}
        />
        <div className="price-slider-track">
          <div
            className="price-slider-range"
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
