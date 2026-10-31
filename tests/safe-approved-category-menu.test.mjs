import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeApprovedCategoryOptions,shouldResetUnavailableCategory} from '../src/ui/echo/safeApprovedCategoryOptions.ts';
import {matchesCardFilters} from '../src/ui/echo/cardFilters.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('public and device-visible guest labels remain exact, ordered, deduplicated',()=>{
 const publicCategories=['新人','ＡＩ','健康・營養'];
 const guestCategories=['ＡＩ','分享','新人'];
 const merged=safeApprovedCategoryOptions([...publicCategories,...guestCategories]);
 assert.deepEqual(merged,['新人','ＡＩ','健康・營養','分享']);
 assert.deepEqual(publicCategories,['新人','ＡＩ','健康・營養']);
 assert.equal(matchesCardFilters(
  {title:'最新 AI',speaker:'講師',categories:['ＡＩ']},
  {category:merged[1]}),true);
 assert.equal(matchesCardFilters(
  {title:'最新 AI',speaker:'講師',categories:['ＡＩ']},
  {category:'AI'}),false);
});

test('drop every invalid or non-exact category instead of showing an unusable menu option',()=>{
 const input=[
  '', '  ', ' 新人 ', '\n新人','新人\t','新人\r','新人\u0000',
  '<private>','＜private＞','X'.repeat(81),42,null,undefined,
  '新人','ＡＩ','健康 營養','新人'
 ];
 assert.deepEqual(safeApprovedCategoryOptions(input),['新人','ＡＩ','健康 營養']);
});

test('home safely merges public API categories with local-visibility-filtered guest categories',()=>{
 const home=read('app/index.tsx');
 const menu=read('src/ui/echo/LegacyFilterToolbar.tsx');
 const helper=read('src/ui/echo/safeApprovedCategoryOptions.ts');
 assert.match(home,/getCategories\(signal\)/);
 assert.match(home,/visibleGuestFacets\(/);
 assert.match(home,/const categories=useMemo\(\(\)=>ready\?safeApprovedCategoryOptions\(\[/);
 assert.match(home,/\.\.\.\(categoriesQuery\.data\?\?\[\]\),\.\.\.guestFacets\.categories/);
 assert.match(home,/<LegacyFilterToolbar categories=\{categories\}/);
 assert.match(home,/publicCategorySuggestions\(categories,query,4\)/);
 assert.match(menu,/\[null,\.\.\.categories\]\.map\(value=>/);
 assert.match(helper,/categoryFromRoute\(raw\)/);
 assert.match(helper,/safe!==raw/);
 assert.match(helper,/approvedExactCategoryLink/);
 assert.match(helper,/categoryFromRoute\(raw\.normalize\('NFKC'\)\)/);
 assert.doesNotMatch(helper,/R2\.get|localStorage|privateAudio|SELECT |memberProfile/);
});

test('selected removed category resets only after BOTH authorized sources finish successfully',()=>{
 const options=safeApprovedCategoryOptions(['新人','ＡＩ','健康・營養']);
 assert.equal(shouldResetUnavailableCategory('新人',options,true),false);
 assert.equal(shouldResetUnavailableCategory(null,options,true),false);
 assert.equal(shouldResetUnavailableCategory('已移除',options,true),true);
 assert.equal(shouldResetUnavailableCategory('已移除',options,false),false);
 assert.equal(shouldResetUnavailableCategory('AI',options,true),true);
 assert.equal(shouldResetUnavailableCategory('ＡＩ',options,true),false);
 assert.equal(shouldResetUnavailableCategory('健康・營養',options,true),false);
 assert.equal(shouldResetUnavailableCategory('新人',[],true),true);
 assert.equal(shouldResetUnavailableCategory('新人',[],false),false);
});

test('home category reconciliation waits for healthy complete public and guest API sources',()=>{
 const home=read('app/index.tsx');
 assert.match(home,/categorySourcesReady=ready&&categoriesQuery\.isSuccess&&!categoriesQuery\.isFetching/);
 assert.match(home,/&&previewsQuery\.isSuccess&&!previewsQuery\.isFetching/);
 assert.match(home,/shouldResetUnavailableCategory\(category,categories,categorySourcesReady\)/);
 assert.match(home,/setCategory\(null\)/);
 assert.match(home,/setNotice\('原選取分類目前不在已核准且可見的分類清單中，已清除該分類篩選。'\)/);
 assert.doesNotMatch(home,/getPrivateTracks|R2\.get|readCentralMember/);
});
