# Changelog

## [2.2.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v2.1.0...v2.2.0) (2026-10-07)


### Features

* **app:** reorder the learning duration choices on the home tab [BB-623] ([#206](https://github.com/ASM-joynnovate/buddybird-mobile/issues/206)) ([9fb7a71](https://github.com/ASM-joynnovate/buddybird-mobile/commit/9fb7a718ab3a5e8d62fcf6d64622d3fe9228f155))
* **app:** warn before starting a session with the volume muted [BB-612] ([#202](https://github.com/ASM-joynnovate/buddybird-mobile/issues/202)) ([6adcc16](https://github.com/ASM-joynnovate/buddybird-mobile/commit/6adcc168a19b5834879e99469e26cc5ac2e62062))


### Bug Fixes

* **app:** close the bottom sheet with the Android back button [BB-624] ([#208](https://github.com/ASM-joynnovate/buddybird-mobile/issues/208)) ([d56b71d](https://github.com/ASM-joynnovate/buddybird-mobile/commit/d56b71de7a08e455368a76aeb4cc8b724a1771dd))
* **app:** improve en-US translations [BB-611] ([#205](https://github.com/ASM-joynnovate/buddybird-mobile/issues/205)) ([fc8a4f8](https://github.com/ASM-joynnovate/buddybird-mobile/commit/fc8a4f8fab2a8d125a500a53218af7178d578cba))
* **app:** replace the permission screen buttons with a single Continue button [BB-630] ([#212](https://github.com/ASM-joynnovate/buddybird-mobile/issues/212)) ([f4197e5](https://github.com/ASM-joynnovate/buddybird-mobile/commit/f4197e57a40b33f7fbb7a9e85f57c0fb0687d414))
* **app:** skip measuring the duration of pending recordings [BB-627] ([#209](https://github.com/ASM-joynnovate/buddybird-mobile/issues/209)) ([f73b38e](https://github.com/ASM-joynnovate/buddybird-mobile/commit/f73b38e140765cafa686d341a5447e551029ecf9))
* **app:** skip the FCM token fetch on iOS without an APNs token [BB-626] ([#210](https://github.com/ASM-joynnovate/buddybird-mobile/issues/210)) ([1e0aea2](https://github.com/ASM-joynnovate/buddybird-mobile/commit/1e0aea262139ae78dd6260072eaad3d22d7fe5c1))
* **app:** skip the volume check on the iOS simulator [BB-612] ([#204](https://github.com/ASM-joynnovate/buddybird-mobile/issues/204)) ([4729366](https://github.com/ASM-joynnovate/buddybird-mobile/commit/472936619145237312dc0297e96fbb85cea06b2e))
* **app:** treat a file as missing when its folder does not exist [BB-628] ([#211](https://github.com/ASM-joynnovate/buddybird-mobile/issues/211)) ([c4df46c](https://github.com/ASM-joynnovate/buddybird-mobile/commit/c4df46c090919a3759c86d9c0b1c3c8f84f951aa))
* **app:** wait for the server login before querying the new account [BB-625] ([#207](https://github.com/ASM-joynnovate/buddybird-mobile/issues/207)) ([3ff5f91](https://github.com/ASM-joynnovate/buddybird-mobile/commit/3ff5f91eff0f7c38089f176bcab962e304029ee1))

## [2.1.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v2.0.0...v2.1.0) (2026-10-06)


### Features

* **app:** open notification and announcement photos in a full-screen viewer [BB-609] ([#201](https://github.com/ASM-joynnovate/buddybird-mobile/issues/201)) ([7dcc219](https://github.com/ASM-joynnovate/buddybird-mobile/commit/7dcc2193bd33978b1b141ddb224cfd38b72cb0cd))


### Bug Fixes

* **app:** sign out the anonymous session when the server rejects the login [BB-608] ([#199](https://github.com/ASM-joynnovate/buddybird-mobile/issues/199)) ([e454a87](https://github.com/ASM-joynnovate/buddybird-mobile/commit/e454a87d5761e59d7bcda7a3f8c953a40213eb79))

## [2.0.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.6.1...v2.0.0) (2026-10-05)


### Bug Fixes

* **app:** finish the migration after the recordings are uploaded [BB-605] ([#198](https://github.com/ASM-joynnovate/buddybird-mobile/issues/198)) ([8026292](https://github.com/ASM-joynnovate/buddybird-mobile/commit/80262920bcc4be9b221f90d0ec1ce2f025d8a6ac))
* **app:** show the whole mic icon in the recording guide [BB-604] ([#196](https://github.com/ASM-joynnovate/buddybird-mobile/issues/196)) ([f2089c1](https://github.com/ASM-joynnovate/buddybird-mobile/commit/f2089c178677b7423f0c36ce74cdf95854ccbe2f))

## [1.6.1](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.6.0...v1.6.1) (2026-10-05)


### Bug Fixes

* **app:** declare GoogleUtilities in both iOS targets to fix the archive build [BB-601] ([#194](https://github.com/ASM-joynnovate/buddybird-mobile/issues/194)) ([16fd51b](https://github.com/ASM-joynnovate/buddybird-mobile/commit/16fd51bb0c79bd69d3566838f97b8287c39fe333))

## [1.6.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.5.0...v1.6.0) (2026-10-05)


### Features

* **app:** delete devices from the connected devices list ([#192](https://github.com/ASM-joynnovate/buddybird-mobile/issues/192)) ([86b5bc2](https://github.com/ASM-joynnovate/buddybird-mobile/commit/86b5bc27934d17ff3d0c44076a2916208107c069))
* **app:** update notifications and announcements for the new APIs [BB-601] ([#193](https://github.com/ASM-joynnovate/buddybird-mobile/issues/193)) ([571db3d](https://github.com/ASM-joynnovate/buddybird-mobile/commit/571db3dad798d346b6ec37c348275ed0d629d90c))
* **app:** update the recording guide distance and pitch steps [BB-101] ([#188](https://github.com/ASM-joynnovate/buddybird-mobile/issues/188)) ([18c8feb](https://github.com/ASM-joynnovate/buddybird-mobile/commit/18c8febdc85cd47ece77da373d8786a43727d690))


### Bug Fixes

* **app:** ask to log in to the existing account when linking fails ([#189](https://github.com/ASM-joynnovate/buddybird-mobile/issues/189)) ([1b2027d](https://github.com/ASM-joynnovate/buddybird-mobile/commit/1b2027d8154a3bda67914c17f0943a9c5e6afbac))
* **app:** change the session detail empty text [BB-437] ([#191](https://github.com/ASM-joynnovate/buddybird-mobile/issues/191)) ([fb034b4](https://github.com/ASM-joynnovate/buddybird-mobile/commit/fb034b44389ea4f38587bc157fba59d2410bc7c3))

## [1.5.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.4.0...v1.5.0) (2026-10-05)


### Features

* **app:** read active time from the summary and report APIs [BB-595] ([#187](https://github.com/ASM-joynnovate/buddybird-mobile/issues/187)) ([306a493](https://github.com/ASM-joynnovate/buddybird-mobile/commit/306a4933f4318ba5a3b338d0f35fd21a769f694d))


### Bug Fixes

* **app:** load every recording length in the word editor [BB-441] ([#184](https://github.com/ASM-joynnovate/buddybird-mobile/issues/184)) ([de1aa29](https://github.com/ASM-joynnovate/buddybird-mobile/commit/de1aa290e99885b7aa0bc63a45eea039c6c51b37))
* **app:** show the offline banner when the internet is unreachable [BB-590] ([#186](https://github.com/ASM-joynnovate/buddybird-mobile/issues/186)) ([39905cc](https://github.com/ASM-joynnovate/buddybird-mobile/commit/39905cc41ff68ecac2029e9b34c052ae215eab1d))

## [1.4.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.3.1...v1.4.0) (2026-10-04)


### Features

* **app:** add a today button to the report screen [BB-589] ([#180](https://github.com/ASM-joynnovate/buddybird-mobile/issues/180)) ([8dd1017](https://github.com/ASM-joynnovate/buddybird-mobile/commit/8dd101710b8feee40046b45e67b650bc855ed1a8))
* **app:** redesign the word recording guide [BB-101] ([#182](https://github.com/ASM-joynnovate/buddybird-mobile/issues/182)) ([ef9c9a4](https://github.com/ASM-joynnovate/buddybird-mobile/commit/ef9c9a4a22bb30bf847ba6363a1014cd868e8796))
* **app:** show recording lengths in hundredths of a second [BB-441] ([#178](https://github.com/ASM-joynnovate/buddybird-mobile/issues/178)) ([84faceb](https://github.com/ASM-joynnovate/buddybird-mobile/commit/84faceb95a845e8a8db9a58b4ba8617fd2696a12))
* **app:** sort and search parrot species [BB-99] ([#181](https://github.com/ASM-joynnovate/buddybird-mobile/issues/181)) ([5d3c850](https://github.com/ASM-joynnovate/buddybird-mobile/commit/5d3c85044eb2c6292f6d39eb3139e67015972e2b))


### Bug Fixes

* **app:** center the bottom sheet on tablets [BB-592] ([#175](https://github.com/ASM-joynnovate/buddybird-mobile/issues/175)) ([d3d6961](https://github.com/ASM-joynnovate/buddybird-mobile/commit/d3d6961fed915ebbdbaeebdb259fc8b90d2bbca4))
* **app:** refresh the battery level on the session screen [BB-588] ([#179](https://github.com/ASM-joynnovate/buddybird-mobile/issues/179)) ([be295e9](https://github.com/ASM-joynnovate/buddybird-mobile/commit/be295e9ad39a127ad284e420e922eb160d7035c5))
* **app:** remount the app when the signed-in account changes ([#176](https://github.com/ASM-joynnovate/buddybird-mobile/issues/176)) ([380aabb](https://github.com/ASM-joynnovate/buddybird-mobile/commit/380aabb11dd98af35bdd6079b5c8a16858900554))
* **app:** show the offline banner above the header [BB-590] ([#174](https://github.com/ASM-joynnovate/buddybird-mobile/issues/174)) ([10e44c6](https://github.com/ASM-joynnovate/buddybird-mobile/commit/10e44c621d8d2d1ec505f5efb4b9d98843df91e3))

## [1.3.1](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.3.0...v1.3.1) (2026-10-04)


### Bug Fixes

* **app:** fix onboarding, word recording, tab, and report issues found after the v2 release ([#166](https://github.com/ASM-joynnovate/buddybird-mobile/issues/166)) ([5bf5ada](https://github.com/ASM-joynnovate/buddybird-mobile/commit/5bf5adaa6e8ac2dfabae3260d13e5ba9da5eb103))

## [1.3.0](https://github.com/ASM-joynnovate/buddybird-mobile/compare/v1.2.0...v1.3.0) (2026-10-04)


### Features

* **app:** rebuild the app on Ignite with the v2 screens connected to buddybird-api ([#161](https://github.com/ASM-joynnovate/buddybird-mobile/issues/161)) ([6210fe9](https://github.com/ASM-joynnovate/buddybird-mobile/commit/6210fe996e286f6e4d7db5763828eb40f512e04d))
