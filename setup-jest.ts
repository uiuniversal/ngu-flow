import 'jest-preset-angular/setup-jest';

// mock structuredClone function
var structuredClone = function (obj: any) {
  return JSON.parse(JSON.stringify(obj));
};

// mock the window object
Object.defineProperty(window, 'structuredClone', { value: structuredClone });
