import debounce from 'debounce';

export const load = (state: boolean, setState: (state: boolean) => void) => {
  const debounced = debounce((state: boolean, setState: (state: boolean) => void) => {
    setState(state);
  }, 150);

  if (state === true) {
    setState(true);
  } else {
    debounced(state, setState);
  }
};
