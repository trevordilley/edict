import { None, Option } from '@hqoss/monads';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HomeState {
  tags: Option<string[]>;
  selectedTab: string;
}

const initialState: HomeState = {
  tags: None,
  selectedTab: 'Global Feed',
};

const slice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    startLoadingTags: () => initialState,
    changeTab: (state, { payload: tab }: PayloadAction<string>) => {
      state.selectedTab = tab;
    },
  },
});

export const { startLoadingTags, changeTab } = slice.actions;

export default slice.reducer;
