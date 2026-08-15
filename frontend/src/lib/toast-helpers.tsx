import { toast } from 'react-hot-toast';
import React from 'react';

export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[250px]">
        <p className="text-gray-800 font-medium text-sm md:text-base">{message}</p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            className="px-4 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            className="px-4 py-1.5 text-sm font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      position: 'top-center',
      style: {
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #f3f4f6',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    });
  });
};
