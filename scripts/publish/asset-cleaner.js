const { PLATFORM_ASSET_MATCHERS } = require('./constants');

class ReleaseAssetCleaner {
  constructor(githubClient) {
    this.githubClient = githubClient;
  }

  isPlatformAssetName(assetName, platform) {
    if (!assetName) return false;

    const normalized = assetName.toLowerCase();
    const matchers = PLATFORM_ASSET_MATCHERS[platform] || [];
    return matchers.some((matcher) => matcher(normalized));
  }

  async deleteExistingPlatformAssets({ owner, repo, version, platform }) {
    const tag = `v${version}`;
    let release;

    try {
      release = await this.githubClient.getReleaseByTag(owner, repo, tag);
    } catch (error) {
      if (error && error.statusCode === 404) {
        console.log(`forge-publish: release ${tag} does not exist yet, skipping cleanup.`);
        return;
      }
      throw error;
    }

    const assets = Array.isArray(release && release.assets) ? release.assets : [];
    const platformAssets = assets.filter((asset) => this.isPlatformAssetName(asset.name, platform));

    if (platformAssets.length === 0) {
      console.log(`forge-publish: no existing ${platform} assets to replace on ${tag}.`);
      return;
    }

    console.log(`forge-publish: deleting ${platformAssets.length} existing ${platform} assets on ${tag}.`);
    for (const asset of platformAssets) {
      await this.githubClient.deleteReleaseAsset(owner, repo, asset.id);
      console.log(`forge-publish: deleted asset ${asset.name}`);
    }
  }
}

module.exports = {
  ReleaseAssetCleaner,
};
