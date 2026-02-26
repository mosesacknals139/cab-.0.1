const fs = require('fs');
const path = require('path');

const authBase = path.join(__dirname, 'src', 'app', '(auth)');
const brokenParent = path.join(authBase, ')');

function fixRoute(authType) {
    // Source: (auth)/)/sign-{authType}/[/[...sign-{authType}/]/]/page.tsx
    const brokenDir = path.join(brokenParent, authType);
    const items = fs.readdirSync(brokenDir, { recursive: true });
    console.log(`Files in (auth)/)/${authType}:`, items);

    // Find the page.tsx in the nested mess
    const pageTsx = items.find(f => f.endsWith('page.tsx'));
    if (!pageTsx) {
        console.log(`No page.tsx found for ${authType}`);
        return;
    }

    const srcFile = path.join(brokenDir, pageTsx);
    const destDir = path.join(authBase, authType, `[[...${authType}]]`);
    const destFile = path.join(destDir, 'page.tsx');

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied page.tsx to: ${destFile}`);
}

try {
    fixRoute('sign-in');
    fixRoute('sign-up');

    // Clean up the broken parent `)` folder
    fs.rmSync(brokenParent, { recursive: true, force: true });
    console.log('Cleaned up broken ) folder');

    // Also clean up the empty sign-in/sign-up folders in src/app root if they exist
    const rootSignIn = path.join(__dirname, 'src', 'app', 'sign-in');
    const rootSignUp = path.join(__dirname, 'src', 'app', 'sign-up');
    if (fs.existsSync(rootSignIn)) {
        const contents = fs.readdirSync(path.join(rootSignIn, '[[...sign-in]]'));
        if (contents.length === 0) {
            fs.rmSync(rootSignIn, { recursive: true, force: true });
            console.log('Cleaned up empty root sign-in folder');
        }
    }
    if (fs.existsSync(rootSignUp)) {
        const contents = fs.readdirSync(path.join(rootSignUp, '[[...sign-up]]'));
        if (contents.length === 0) {
            fs.rmSync(rootSignUp, { recursive: true, force: true });
            console.log('Cleaned up empty root sign-up folder');
        }
    }

    console.log('Done!');
} catch (e) {
    console.error('Error:', e.message);
}
