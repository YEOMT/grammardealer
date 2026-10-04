/** Historic input/learning tests exercise the old campaign via current UI and controller. */
export async function useLegacyCampaign(page){
 await page.route('**/src/main.js*',async route=>{const response=await route.fetch();const source=await response.text();await route.fulfill({response,body:source.replaceAll('/src/game/runController.js','/tests/helpers/legacy-controller.js').replace("'./game/runController.js'","'/tests/helpers/legacy-controller.js'")});});
}
