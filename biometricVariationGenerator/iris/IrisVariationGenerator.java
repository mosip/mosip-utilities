import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.function.BiFunction;
import java.awt.image.RescaleOp;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import javax.imageio.ImageIO;
import java.awt.geom.QuadCurve2D;
import java.awt.geom.Area;
import java.awt.geom.Path2D;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.awt.geom.Point2D;
import java.awt.*;

public class IrisVariationGenerator {

    static String strIRISvariation = "Original";

    public static final int BLUR_IRIS = 1 << 0; // 00000001
    public static final int BRIGHT_IRIS = 1 << 1; // 00000010
    public static final int HIGH_CONTRAST_IRIS = 1 << 2; // 00000100
    public static final int LOW_CONTRAST_IRIS = 1 << 3; // 00001000
    public static final int REFLECTION_IRIS = 1 << 4; // 00010000
    public static final int GLARE_IRIS = 1 << 5; // 00100000
    public static final int ANGLE_IRIS = 1 << 6; // 01000000
    public static final int PUPIL_DILATION_IRIS = 1 << 7; // 10000000
    public static final int PUPIL_CONTRACTION_IRIS = 1 << 8; // 00000001 00000000
    public static final int AGING_IRIS = 1 << 9; // 00000010 00000000
    public static final int EYELASHES_IRIS = 1 << 10; // 00000100 00000000
    public static final int EYELIDS_IRIS = 1 << 11; // 00001000 00000000
    public static final int HIGH_RESOLUTION_IRIS = 1 << 12; // 00010000 00000000
    public static final int LOW_RESOLUTION_IRIS = 1 << 13; // 00100000 00000000
    public static final int HUMID_ENV_IRIS = 1 << 14; // 01000000 00000000
    public static final int HIGH_TEMP_ENV_IRIS = 1 << 15; // 10000000 00000000
    public static final int LOW_TEMP_ENV_IRIS = 1 << 16; // 00000001 00000000 00000000
    public static final int TEXTURE_CHANGE_IRIS = 1 << 17; // 00000010 00000000 00000000
    public static final int COLOR_CHANGE_IRIS = 1 << 18; // 00000100 00000000 00000000
    public static final int WATERY_IRIS = 1 << 19; // 00001000 00000000 00000000

    // Variable to store the combination of variations
    public static int irisVariations = 0;

    public static void main(String[] args) throws IOException {

        // Check if the correct number of arguments is provided
        if (args.length < 2) {
            System.out.println("Usage: java IrisVariationGenerator <inputIRISTemplateDirectoryPath> <outputUniqueIRISDataPath>");
            return;
        }

        /// Provide folder where the base template image present
        String inputIRISTemplateDirectoryPath = args[0]; //"C:\\Users\\sivan\\Downloads\\SynData\\template\\iris_data";
        
        /// Provide folder to where the generated variant images should be copied
        String outputUniqueIRISDataPath = args[1]; //"C:\\Users\\sivan\\Downloads\\SynData\\output\\iris_data";
        
        generateIRISVariations(inputIRISTemplateDirectoryPath, outputUniqueIRISDataPath);
    }




    /**************************************************************
     * Generates mutlple variations based on the provided
     * input image and copies to the target folder
     ****************************************************************/
    public static void generateIRISVariations(String inputIRISTemplateDirectoryPath, String outputUniqueIRISDataPath) {
        resetIRISVariations();

        // Set multiple variations at once
        setIRISVariations(BLUR_IRIS | BRIGHT_IRIS | HIGH_CONTRAST_IRIS | LOW_CONTRAST_IRIS | REFLECTION_IRIS
                | GLARE_IRIS | ANGLE_IRIS | PUPIL_DILATION_IRIS | PUPIL_CONTRACTION_IRIS | AGING_IRIS | EYELASHES_IRIS
                | EYELIDS_IRIS | HIGH_RESOLUTION_IRIS  | LOW_RESOLUTION_IRIS | HUMID_ENV_IRIS | HIGH_TEMP_ENV_IRIS 
                | LOW_TEMP_ENV_IRIS | TEXTURE_CHANGE_IRIS | COLOR_CHANGE_IRIS | WATERY_IRIS);

        try {
            // Get all file names in the directory and subdirectories
            List<String> fileNameAbsPaths = listFiles(inputIRISTemplateDirectoryPath);

            for (String fileNameAbsPath : fileNameAbsPaths) {
                // Convert the string path to a Path object
                Path path = Paths.get(fileNameAbsPath);

                // Get the file name
                String fileName = path.getFileName().toString();

                // Get the parent directory of the file
                Path parentPath = path.getParent();

                // Extract the last two segments from the parent path
                String extractedPath = parentPath.getName(parentPath.getNameCount() - 1).toString();
                generateIRISVariations(fileNameAbsPath, outputUniqueIRISDataPath, extractedPath, fileName);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Method to set multiple variations
    public static void setIRISVariations(int variations) {
        irisVariations |= variations;
    }

    // Method to reset all variations
    public static void resetIRISVariations() {
        irisVariations = 0;
    }

    // Method to check if a specific variation is set
    public static boolean isVariationSet(int variation) {
        return (irisVariations & variation) != 0;
    }

    public static void generateIRISVariations(String fileNameAbsPath,
            String outputUniqueIRISDataPath, String IRISPath, String FileName) {

        // Create a list of active Variations based on boolean flags
        List<BiFunction<BufferedImage, Integer, BufferedImage>> activeVariations = new ArrayList<>();
        if (isVariationSet(BLUR_IRIS))
            activeVariations.add(IrisVariationGenerator::applyBlurIRISVariation);
        if (isVariationSet(BRIGHT_IRIS))
            activeVariations.add(IrisVariationGenerator::applyBrightIRISVariation);
        if (isVariationSet(HIGH_CONTRAST_IRIS))
            activeVariations.add(IrisVariationGenerator::applyHighContrastIRISVariation);
        if (isVariationSet(LOW_CONTRAST_IRIS))
            activeVariations.add(IrisVariationGenerator::applyLowContrastIRISVariation);
        if (isVariationSet(REFLECTION_IRIS))
            activeVariations.add(IrisVariationGenerator::applyReflectionIRISVariation);
        if (isVariationSet(GLARE_IRIS))
            activeVariations.add(IrisVariationGenerator::applyGlareIRISVariation);
        //if (isVariationSet(ANGLE_IRIS))
        //    activeVariations.add(IrisVariationGenerator::applyAngleIRISVariation);
        if (isVariationSet(PUPIL_DILATION_IRIS))
            activeVariations.add(IrisVariationGenerator::applyPupilDilationIRISVariation);
        if (isVariationSet(PUPIL_CONTRACTION_IRIS))
            activeVariations.add(IrisVariationGenerator::applyPupilContractionIRISVariation);
        if (isVariationSet(AGING_IRIS))
            activeVariations.add(IrisVariationGenerator::applyAgingEffectIRISVariation);
        if (isVariationSet(EYELASHES_IRIS))
            activeVariations.add(IrisVariationGenerator::applyEyelashesIRISVariation);
        if (isVariationSet(EYELIDS_IRIS))
            activeVariations.add(IrisVariationGenerator::applyEyelidsIRISVariation);
        if (isVariationSet(HIGH_RESOLUTION_IRIS))
            activeVariations.add(IrisVariationGenerator::applyHighResolutionIRISVariations);
        if (isVariationSet(LOW_RESOLUTION_IRIS))
            activeVariations.add(IrisVariationGenerator::applyLowResolutionIRISVariations);
        if (isVariationSet(HUMID_ENV_IRIS))
            activeVariations.add(IrisVariationGenerator::applyHumidEffectIRISVariation);
        if (isVariationSet(HIGH_TEMP_ENV_IRIS))
            activeVariations.add(IrisVariationGenerator::applyHighTemparatureIRISVariation);
        if (isVariationSet(LOW_TEMP_ENV_IRIS))
            activeVariations.add(IrisVariationGenerator::applyLowTemparatureIRISVariation);
        if (isVariationSet(TEXTURE_CHANGE_IRIS))
            activeVariations.add(IrisVariationGenerator::applyTextureIRISVariation);
        if (isVariationSet(COLOR_CHANGE_IRIS))
            activeVariations.add(IrisVariationGenerator::applyColorChangeIRISVariation);
         if (isVariationSet(WATERY_IRIS))
            activeVariations.add(IrisVariationGenerator::applyWateryIRISVariation);

        // Load the original IRIS image
        strIRISvariation = "Original";
        BufferedImage irisImage = null;
        try {
            irisImage = ImageIO.read(new File(fileNameAbsPath));
        } catch (IOException e) {
            // Handle the exception (e.g., log it, notify the user, etc.)
            e.printStackTrace();
        }

        if (irisImage == null) {
            System.out.println("Failed to load iris image.");
            return;
        }

        String outputIRISPath = Paths.get(outputUniqueIRISDataPath, IRISPath, strIRISvariation + "_" + FileName).toString();

        // System.out.println("------------------" + outputIRISPath);
        // Create directories if they do not exist
        Path outputPath = Paths.get(outputIRISPath).getParent();

        // First copy the original image as well
        try {
            if (!Files.exists(outputPath)) {
                Files.createDirectories(outputPath);
            }
            ImageIO.write(irisImage, "png", new File(outputIRISPath));
        } catch (IOException e) {
            System.err.println(e.getMessage());
        }

        // Apply the Variations and genearate varations for this profile
        for (int j = 1; j <= activeVariations.size(); j++) {
            BiFunction<BufferedImage, Integer, BufferedImage> Variation = activeVariations
                    .get((j - 1) % activeVariations.size());
            BufferedImage irisImageWithVariation = Variation.apply(irisImage, j);

            outputIRISPath = Paths.get(outputUniqueIRISDataPath, IRISPath, strIRISvariation + "_" + FileName).toString();
            // System.out.println("XXXXXXXXXXXXXXXX------------------" + outputIRISPath);

            try {
                ImageIO.write(irisImageWithVariation, "png", new File(outputIRISPath));
            } catch (IOException e) {
                // Handle the exception (e.g., log it, notify the user, etc.)
                e.printStackTrace();
                System.err.println(e.getMessage());
            }
        }
    }

    
    /**************************************************************
     * IRIS Watery Variation
     ****************************************************************/
    private static BufferedImage applyWateryIRISVariation(BufferedImage iris, int seed) {
        strIRISvariation = "WateryChange";
        int width = iris.getWidth();
        int height = iris.getHeight();

        BufferedImage wateryIRIS = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = wateryIRIS.createGraphics();
        g2d.drawImage(iris, 0, 0, null);

        // Step 1: Apply a Gaussian blur to soften the IRIS
        applyGaussianBlur(wateryIRIS);

        // Step 2: Apply Perlin noise-based ripple distortion
        applyPerlinNoiseRippleEffect(wateryIRIS);

        // Step 3: Add a complex reflection effect
        applyComplexReflectionEffect(g2d, width, height);

        // Step 4: Add multiple layers of gradient overlays for depth
        applyGradientOverlay(g2d, width, height);

        g2d.dispose();
        return wateryIRIS;
    }

    // Method to apply a Gaussian blur effect
    private static void applyGaussianBlur(BufferedImage image) {
        float[] matrix = {
            1 / 16f, 2 / 16f, 1 / 16f,
            2 / 16f, 4 / 16f, 2 / 16f,
            1 / 16f, 2 / 16f, 1 / 16f
        };
        ConvolveOp op = new ConvolveOp(new Kernel(3, 3, matrix));
        BufferedImage tempImage = new BufferedImage(image.getWidth(), image.getHeight(), image.getType());
        op.filter(image, tempImage);
        Graphics2D g2d = image.createGraphics();
        g2d.drawImage(tempImage, 0, 0, null);
        g2d.dispose();
    }

    // Method to apply Perlin noise-based ripple distortion effect
    private static void applyPerlinNoiseRippleEffect(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage distortedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);

        Random random = new Random();
        float frequency = 0.1f;
        float amplitude = 5.0f;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int dx = (int) (amplitude * noise(frequency * x, frequency * y, random));
                int dy = (int) (amplitude * noise(frequency * y, frequency * x, random));

                int newX = clamp(x + dx, 0, width - 1);
                int newY = clamp(y + dy, 0, height - 1);

                distortedImage.setRGB(x, y, image.getRGB(newX, newY));
            }
        }

        Graphics2D g2d = image.createGraphics();
        g2d.drawImage(distortedImage, 0, 0, null);
        g2d.dispose();
    }

    // Perlin noise function for ripple effect
    private static float noise(float x, float y, Random random) {
        return (float) (random.nextGaussian() * 0.5 + 0.5); // Simulate Perlin noise
    }

    // Method to apply a complex reflection effect
    private static void applyComplexReflectionEffect(Graphics2D g2d, int width, int height) {
        Point2D center = new Point2D.Float(width / 2f, height / 2f);
        float radius = Math.min(width, height) / 3f;
        float[] dist = {0.0f, 0.5f, 1.0f};
        Color[] colors = {
            new Color(255, 255, 255, 150), // Bright white for highlight
            new Color(255, 255, 255, 50),  // Softer white
            new Color(255, 255, 255, 0)    // Fully transparent
        };
        RadialGradientPaint reflectionPaint = new RadialGradientPaint(center, radius, dist, colors);
        g2d.setPaint(reflectionPaint);
        g2d.fillOval((int) (width / 4f), (int) (height / 4f), (int) (width / 2f), (int) (height / 2f));
    }

    // Method to apply multiple gradient overlays for depth
    private static void applyGradientOverlay(Graphics2D g2d, int width, int height) {
        GradientPaint gradient1 = new GradientPaint(0, 0, new Color(255, 255, 255, 30), 0, height, new Color(0, 0, 0, 120));
        GradientPaint gradient2 = new GradientPaint(0, height / 2, new Color(0, 0, 0, 60), width, height, new Color(255, 255, 255, 10));

        g2d.setPaint(gradient1);
        g2d.fillRect(0, 0, width, height);

        g2d.setPaint(gradient2);
        g2d.fillRect(0, 0, width, height);
    }




    /**************************************************************
     * IRIS Color Variation
     ****************************************************************/
    private static BufferedImage applyColorChangeIRISVariation(BufferedImage image, int seed) {
        strIRISvariation = "ColorChange";
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();

        // Draw the original image
        g.drawImage(image, 0, 0, null);

        // Apply color change effect
        Random random = new Random();

        float hueShift = random.nextFloat(); // Random hue shift between 0.0 and 1.0
        float saturationFactor = 0.5f + random.nextFloat() * 1.5f; // Random saturation factor between 0.5 and 2.0
        float brightnessFactor = 0.7f + random.nextFloat() * 0.6f; // Random brightness factor between 0.7 and 1.3

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(image.getRGB(x, y));

                // Convert RGB to HSB
                float[] hsbValues = Color.RGBtoHSB(originalColor.getRed(), originalColor.getGreen(),
                        originalColor.getBlue(), null);

                // Apply hue, saturation, and brightness adjustments
                float newHue = (hsbValues[0] + hueShift) % 1.0f;
                float newSaturation = clamp(hsbValues[1] * saturationFactor, 0.0f, 1.0f);
                float newBrightness = clamp(hsbValues[2] * brightnessFactor, 0.0f, 1.0f);

                // Convert back to RGB
                int rgb = Color.HSBtoRGB(newHue, newSaturation, newBrightness);

                // Set the new color with the color change effect applied
                result.setRGB(x, y, rgb);
            }
        }

        g.dispose();
        return result;
    }

    // Method to clamp float values between min and max
    private static float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }

    /**************************************************************
     * IRIS Texture Variation
     ****************************************************************/
    private static BufferedImage applyTextureIRISVariation(BufferedImage image, int seed) {
        strIRISvariation = "TextureChange";
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();

        // Draw the original image
        g.drawImage(image, 0, 0, null);

        // Apply texture effect
        Random random = new Random();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(image.getRGB(x, y));

                // Apply random pixelation to create a texture effect
                int textureType = random.nextInt(3);
                int red = originalColor.getRed();
                int green = originalColor.getGreen();
                int blue = originalColor.getBlue();

                switch (textureType) {
                    case 0: // Add a rough texture
                        red = clamp(red + random.nextInt(30) - 15);
                        green = clamp(green + random.nextInt(30) - 15);
                        blue = clamp(blue + random.nextInt(30) - 15);
                        break;
                    case 1: // Add a stripe-like texture
                        if ((x + y) % 10 < 5) {
                            red = clamp(red + 20);
                            green = clamp(green + 20);
                            blue = clamp(blue + 20);
                        } else {
                            red = clamp(red - 20);
                            green = clamp(green - 20);
                            blue = clamp(blue - 20);
                        }
                        break;
                    case 2: // Add a circular pattern texture
                        int centerX = width / 2;
                        int centerY = height / 2;
                        double distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                        if (distance % 20 < 10) {
                            red = clamp(red + 15);
                            green = clamp(green + 15);
                            blue = clamp(blue + 15);
                        } else {
                            red = clamp(red - 15);
                            green = clamp(green - 15);
                            blue = clamp(blue - 15);
                        }
                        break;
                }

                // Set the new color with the texture effect applied
                Color newColor = new Color(red, green, blue);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        g.dispose();
        return result;
    }

    /**************************************************************
     * Low Temp environment IRIS Variation
     ****************************************************************/
    private static BufferedImage applyLowTemparatureIRISVariation(BufferedImage image, int seed) {
        strIRISvariation = "LowTemparatureSurrounding";
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();

        // Draw the original image
        g.drawImage(image, 0, 0, null);

        // Apply cold effect
        Random random = new Random();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(image.getRGB(x, y));

                // Slightly reduce the red component and increase the blue to simulate cold
                int red = clamp(originalColor.getRed() - random.nextInt(20)); // Reduce red
                int green = clamp(originalColor.getGreen() - random.nextInt(10)); // Slightly reduce green
                int blue = clamp(originalColor.getBlue() + random.nextInt(30)); // Increase blue

                // Apply slight blur and noise to simulate frost
                if (random.nextInt(100) < 10) { // 10% chance to add frosty noise
                    int noise = random.nextInt(50);
                    red = clamp(red + noise);
                    green = clamp(green + noise);
                    blue = clamp(blue + noise);
                }

                // Set the new color with the low temperature effect applied
                Color newColor = new Color(red, green, blue);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        g.dispose();
        return result;
    }

    /**************************************************************
     * HighTemp environment IRIS Variation
     ****************************************************************/
    private static BufferedImage applyHighTemparatureIRISVariation(BufferedImage image, int seed) {
        strIRISvariation = "HighTemparatureSurrounding";
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();

        // Draw the original image
        g.drawImage(image, 0, 0, null);

        // Apply heat distortion effect
        Random random = new Random();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                // Slight random shift to simulate heat distortion
                int offsetX = x + (int) (Math.sin(y / 10.0) * 2);
                int offsetY = y + (int) (Math.cos(x / 10.0) * 2);

                // Clamp the offsets to ensure they are within bounds
                offsetX = clamp(offsetX, 0, width - 1);
                offsetY = clamp(offsetY, 0, height - 1);

                Color originalColor = new Color(image.getRGB(offsetX, offsetY));

                // Slightly increase the red component to simulate warmth
                int red = clamp(originalColor.getRed() + random.nextInt(30));
                int green = clamp(originalColor.getGreen() - random.nextInt(10)); // Reduce green slightly
                int blue = clamp(originalColor.getBlue() - random.nextInt(20)); // Reduce blue slightly

                // Set the new color with the high temperature effect applied
                Color newColor = new Color(red, green, blue);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        g.dispose();
        return result;
    }

    // Method to clamp coordinates within image bounds
    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    /**************************************************************
     * Humid environment IRIS Variation
     ****************************************************************/
    private static BufferedImage applyHumidEffectIRISVariation(BufferedImage image, int seed) {
        strIRISvariation = "HumidSurrounding";
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();

        // Draw the original image
        g.drawImage(image, 0, 0, null);

        // Apply random noise and blur effect to simulate humidity
        Random random = new Random();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(image.getRGB(x, y));

                // Add noise by randomly altering the RGB values
                int noiseFactor = random.nextInt(30) - 15; // Random value between -15 and 15
                int red = clamp(originalColor.getRed() + noiseFactor);
                int green = clamp(originalColor.getGreen() + noiseFactor);
                int blue = clamp(originalColor.getBlue() + noiseFactor);

                // Slightly blur by averaging with neighboring pixels
                if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
                    Color neighborColor = new Color(image.getRGB(x + 1, y + 1));
                    red = (red + neighborColor.getRed()) / 2;
                    green = (green + neighborColor.getGreen()) / 2;
                    blue = (blue + neighborColor.getBlue()) / 2;
                }

                // Set the new color with the humid effect applied
                Color newColor = new Color(red, green, blue);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        g.dispose();
        return result;
    }

    // Method to clamp RGB values between 0 and 255
    private static int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }

    /**************************************************************
     * Low resolution IRIS Variation
     ****************************************************************/
    private static BufferedImage applyLowResolutionIRISVariations(BufferedImage originalImage, int seed) {
        strIRISvariation = "LowResolution";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same size as the original
        BufferedImage lowResImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = lowResImage.createGraphics();

        // Apply high-quality rendering hints
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Scale the image down to a smaller size and then scale it back up to original
        // size
        int scaleFactor = 2 + (seed % 10); // Example scale factor, varies with each set
        BufferedImage scaledImage = new BufferedImage(width / scaleFactor, height / scaleFactor,
                BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2dScale = scaledImage.createGraphics();
        g2dScale.drawImage(originalImage, 0, 0, scaledImage.getWidth(), scaledImage.getHeight(), null);
        g2dScale.dispose();

        // Draw the scaled-down image back to the original size
        g2d.drawImage(scaledImage, 0, 0, width, height, null);
        g2d.dispose();

        return lowResImage;
    }

    /**************************************************************
     * High resolution IRIS Variation
     ****************************************************************/
    private static BufferedImage applyHighResolutionIRISVariations(BufferedImage originalImage, int seed) {
        strIRISvariation = "HighResolution";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same size as the original
        BufferedImage highResLikeImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = highResLikeImage.createGraphics();

        // Apply high-quality rendering hints
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Scale the image up and then back down to simulate high resolution
        BufferedImage scaledImage = new BufferedImage(width * 2, height * 2, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2dScale = scaledImage.createGraphics();
        g2dScale.drawImage(originalImage, 0, 0, width * 2, height * 2, null);
        g2dScale.dispose();

        // Downscale back to the original size
        g2d.drawImage(scaledImage, 0, 0, width, height, null);
        g2d.dispose();

        return highResLikeImage;
    }

    /**************************************************************
     * EyeLids IRIS Variation
     ****************************************************************/
    private static BufferedImage applyEyelidsIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "EyeLids";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image to hold the result
        BufferedImage eyelidImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = eyelidImage.createGraphics();

        // Draw the original image as the base
        g2d.drawImage(originalImage, 0, 0, null);

        // Set the color for the eyelid (a natural skin tone)
        // g2d.setColor(new Color(224, 192, 160)); // Example skin tone color
        g2d.setColor(new Color(84, 84, 84)); // Light grey color

        // Generate random eyelid patterns
        Random rand = new Random(seed);

        // Upper eyelid
        int upperEyelidY = height / 4 + rand.nextInt(height / 8); // Randomize the position of the upper eyelid
        Path2D upperLid = new Path2D.Double();
        upperLid.moveTo(0, upperEyelidY);
        upperLid.quadTo(width / 2.0, upperEyelidY - height / 8.0, width, upperEyelidY);
        upperLid.lineTo(width, 0); // Line to the top-right corner
        upperLid.lineTo(0, 0); // Line to the top-left corner
        upperLid.closePath();

        // Lower eyelid
        int lowerEyelidY = height * 3 / 4 + rand.nextInt(height / 8); // Randomize the position of the lower eyelid
        Path2D lowerLid = new Path2D.Double();
        lowerLid.moveTo(0, lowerEyelidY);
        lowerLid.quadTo(width / 2.0, lowerEyelidY + height / 8.0, width, lowerEyelidY);
        lowerLid.lineTo(width, height); // Line to the bottom-right corner
        lowerLid.lineTo(0, height); // Line to the bottom-left corner
        lowerLid.closePath();

        // Create areas for the eyelids
        Area eyelidArea = new Area(upperLid);
        eyelidArea.add(new Area(lowerLid));

        // Fill the eyelid area to cover the IRIS
        g2d.fill(eyelidArea);

        // Dispose the graphics context
        g2d.dispose();

        return eyelidImage;
    }

    /**************************************************************
     * EyeLashses IRIS Variation
     ****************************************************************/
    private static BufferedImage applyEyelashesIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "EyeLashses";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image to hold the result
        BufferedImage eyelashImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = eyelashImage.createGraphics();

        // Draw the original image as the base
        g2d.drawImage(originalImage, 0, 0, null);

        // Set a more natural eyelash color (dark brown to black)
        g2d.setColor(new Color(45, 35, 30)); // Dark brown color

        // Generate random eyelash patterns
        Random rand = new Random(seed);
        int numberOfEyelashes = 15 + rand.nextInt(20); // Vary the number of eyelashes

        for (int i = 0; i < numberOfEyelashes; i++) {
            // Random starting point on the X axis, slightly above the top of the IRIS
            int startX = rand.nextInt(width);
            int startY = rand.nextInt(height / 6);

            // Create a curved path to mimic the natural shape of an eyelash
            int controlX = startX + rand.nextInt(width / 10) - width / 20;
            int controlY = startY + rand.nextInt(height / 10);
            int endX = startX + rand.nextInt(width / 6) - width / 12;
            int endY = startY + rand.nextInt(height / 8);

            QuadCurve2D q = new QuadCurve2D.Float(startX, startY, controlX, controlY, endX, endY);

            // Set stroke thickness randomly for variety
            g2d.setStroke(new BasicStroke(1 + rand.nextFloat() * 2));

            // Draw the eyelash
            g2d.draw(q);
        }

        g2d.dispose();
        return eyelashImage;
    }

    /**************************************************************
     * Aging IRIS Variation
     ****************************************************************/
    private static BufferedImage applyAgingEffectIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "Aged";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image to hold the result
        BufferedImage agedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = agedImage.createGraphics();

        // Apply fading effect
        float fadingFactor = 1.0f - (seed % 50) / 100.0f; // Fades colors progressively
        RescaleOp rescaleOp = new RescaleOp(fadingFactor, 0, null);
        BufferedImage fadedImage = rescaleOp.filter(originalImage, null);

        // Apply noise (to simulate wear and tear)
        BufferedImage noisyImage = addNoise(fadedImage, seed);

        // Apply irregularities (e.g., spots or blurs)
        BufferedImage finalAgedImage = addIrregularities(noisyImage, seed);

        g2d.drawImage(finalAgedImage, 0, 0, null);
        g2d.dispose();

        return agedImage;
    }

    private static BufferedImage addNoise(BufferedImage image, int seed) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage noisyImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Random rand = new Random(seed);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgba = image.getRGB(x, y);
                int alpha = (rgba >> 24) & 0xff;
                int red = (rgba >> 16) & 0xff;
                int green = (rgba >> 8) & 0xff;
                int blue = rgba & 0xff;

                // Add noise to each channel
                red = clampColorValue(red + (int) (rand.nextGaussian() * 10));
                green = clampColorValue(green + (int) (rand.nextGaussian() * 10));
                blue = clampColorValue(blue + (int) (rand.nextGaussian() * 10));

                int newPixel = (alpha << 24) | (red << 16) | (green << 8) | blue;
                noisyImage.setRGB(x, y, newPixel);
            }
        }

        return noisyImage;
    }

    private static int clampColorValue(int value) {
        return Math.min(255, Math.max(0, value));
    }

    private static BufferedImage addIrregularities(BufferedImage image, int seed) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage irregularImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = irregularImage.createGraphics();

        // Draw the base image
        g2d.drawImage(image, 0, 0, null);

        // Simulate aging spots or blurs
        Random rand = new Random(seed);
        int spotsCount = 5 + rand.nextInt(15); // Random number of spots
        g2d.setColor(new Color(200, 200, 200, 100)); // Light spots
        for (int i = 0; i < spotsCount; i++) {
            int spotX = rand.nextInt(width);
            int spotY = rand.nextInt(height);
            int spotSize = 5 + rand.nextInt(20);
            g2d.fillOval(spotX, spotY, spotSize, spotSize);
        }

        g2d.dispose();
        return irregularImage;
    }

    /**************************************************************
     * Contraction IRIS Variation
     ****************************************************************/
    private static BufferedImage applyPupilContractionIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "PupilContraction";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image to hold the result
        BufferedImage contractedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = contractedImage.createGraphics();

        // Draw the original image as the base
        g2d.drawImage(originalImage, 0, 0, null);

        // Calculate the pupil's contraction factor (e.g., between 0.1 and 1.0 times the
        // original size)
        double contractionFactor = 0.01 + (seed % 91) / 100.0; // Varies the factor between 0.1 and 1.0

        // Assuming the pupil is at the center of the image (you may need to adjust
        // this)
        int centerX = width / 2;
        int centerY = height / 2;
        int pupilRadius = Math.min(width, height) / 8; // Adjust this to match the actual pupil size

        // Calculate the new pupil size
        int newPupilRadius = (int) (pupilRadius * contractionFactor);

        // Create a mask for the pupil area
        BufferedImage pupilMask = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gMask = pupilMask.createGraphics();
        gMask.setComposite(AlphaComposite.Clear);
        gMask.fillRect(0, 0, width, height);
        gMask.setComposite(AlphaComposite.Src);

        // Draw the contracted pupil
        gMask.setColor(Color.BLACK); // Assuming the pupil is black
        gMask.fillOval(centerX - newPupilRadius, centerY - newPupilRadius, 2 * newPupilRadius, 2 * newPupilRadius);

        gMask.dispose();

        // Apply the pupil mask to the original image to simulate contraction
        g2d.setComposite(AlphaComposite.SrcAtop);
        g2d.drawImage(pupilMask, 0, 0, null);

        g2d.dispose();

        return contractedImage;
    }

    /**************************************************************
     * PupilDilation IRIS Variation
     ****************************************************************/
    private static BufferedImage applyPupilDilationIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "PupilDilation";

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image to hold the result
        BufferedImage dilatedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = dilatedImage.createGraphics();

        // Draw the original image as the base
        g2d.drawImage(originalImage, 0, 0, null);

        // Calculate the pupil's dilation factor (e.g., between 0.5 and 1.5 times the
        // original size)
        double dilationFactor = 0.5 + (seed % 101) / 100.0; // Varies the factor between 0.5 and 1.5

        // Assuming the pupil is at the center of the image (you may need to adjust
        // this)
        int centerX = width / 2;
        int centerY = height / 2;
        int pupilRadius = Math.min(width, height) / 8; // Adjust this to match the actual pupil size

        // Calculate the new pupil size
        int newPupilRadius = (int) (pupilRadius * dilationFactor);

        // Create a mask for the pupil area
        BufferedImage pupilMask = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gMask = pupilMask.createGraphics();
        gMask.setComposite(AlphaComposite.Clear);
        gMask.fillRect(0, 0, width, height);
        gMask.setComposite(AlphaComposite.Src);

        // Draw the dilated pupil
        gMask.setColor(Color.BLACK); // Assuming the pupil is black
        gMask.fillOval(centerX - newPupilRadius, centerY - newPupilRadius, 2 * newPupilRadius, 2 * newPupilRadius);

        gMask.dispose();

        // Apply the pupil mask to the original image to simulate dilation
        g2d.setComposite(AlphaComposite.SrcAtop);
        g2d.drawImage(pupilMask, 0, 0, null);

        g2d.dispose();

        return dilatedImage;
    }

    /**************************************************************
     * Angle IRIS Variation
     ****************************************************************/
    private static BufferedImage applyAngleIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "Angle";

        // Sample the color from the white ball (sclera) in the IRIS
        Color scleraColor = getScleraColor(originalImage);

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Calculate the angle to rotate the image (e.g., between -45 and 45 degrees)
        double angle = -45 + (seed % 90); // Varies the angle between -45 and 45 degrees

        // Create a transform object for the rotation
        AffineTransform transform = new AffineTransform();
        transform.rotate(Math.toRadians(angle), width / 2.0, height / 2.0);

        // Create a new image with the same color as the sclera
        BufferedImage rotatedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = rotatedImage.createGraphics();
        g2d.setColor(scleraColor);
        g2d.fillRect(0, 0, width, height);

        // Apply the rotation to the image
        AffineTransformOp op = new AffineTransformOp(transform, AffineTransformOp.TYPE_BILINEAR);
        op.filter(originalImage, rotatedImage);

        g2d.dispose();

        return rotatedImage;
    }

    private static Color getScleraColor(BufferedImage image) {
        // Sample a pixel from the assumed white ball area (adjust the x, y as needed)
        int x = image.getWidth() / 8;
        int y = image.getHeight() / 8;

        // Get the color of the sampled pixel
        int rgb = image.getRGB(x, y);
        return new Color(rgb);
    }

    /**************************************************************
     * Glare IRIS Variation
     ****************************************************************/
    private static BufferedImage applyGlareIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "Glare";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a copy of the original image to apply the glare
        BufferedImage glareImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = glareImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Set up parameters for the glare effect
        float glareIntensity = 0.3f + 0.005f * seed; // Increase intensity slightly for each image
        int glareSize = (int) (width * 0.1 + (seed % 30)); // Vary the size of the glare
        int xPos = width / 4 + (seed % (width / 2)); // Randomize position
        int yPos = height / 4 + (seed % (height / 2));

        // Draw the glare effect (e.g., a bright white spot with transparency)
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, glareIntensity));
        GradientPaint glarePaint = new GradientPaint(
                xPos, yPos, Color.WHITE,
                xPos + glareSize, yPos + glareSize, new Color(255, 255, 255, 0), true);
        g2d.setPaint(glarePaint);
        g2d.fillOval(xPos, yPos, glareSize, glareSize);

        g2d.dispose();

        return glareImage;
    }

    /**************************************************************
     * Reflection IRIS Variation
     ****************************************************************/
    private static BufferedImage applyReflectionIRISVariation(BufferedImage originalImage, int seed) {
        strIRISvariation = "Reflection";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a copy of the original image to apply the reflection
        BufferedImage reflectionImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = reflectionImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Set up parameters for the reflection effect
        float reflectionIntensity = 0.3f + 0.005f * seed; // Increase intensity slightly for each image
        int ellipseWidth = (int) (width * 0.2 + (seed % 20)); // Vary the width of the reflection ellipse
        int ellipseHeight = (int) (height * 0.2 + (seed % 20)); // Vary the height of the reflection ellipse
        int xPos = width / 4 + (seed % (width / 2)); // Randomize position
        int yPos = height / 4 + (seed % (height / 2));

        // Draw the reflection effect (e.g., a white ellipse with transparency)
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, reflectionIntensity));
        g2d.setColor(Color.WHITE);
        g2d.fillOval(xPos, yPos, ellipseWidth, ellipseHeight);

        g2d.dispose();

        return reflectionImage;
    }

    /**************************************************************
     * Low Contrast IRIS Variation
     ****************************************************************/
    private static BufferedImage applyLowContrastIRISVariation(BufferedImage originalImage, int index) {
        // Calculate contrast factor (e.g., ranging from 1.1 to 2.0)
        float contrastFactor = 1.0f + (-25 * 0.02f); // Adjust contrast factor as needed

        strIRISvariation = "LowContrast";
        // Contrast adjustment with RescaleOp
        float scaleFactor = contrastFactor; // Contrast scaling factor
        float offset = 0f; // No offset, just scaling

        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);

        // Apply the contrast adjustment to the image
        BufferedImage lowContrastImage = rescaleOp.filter(originalImage, null);

        return lowContrastImage;
    }

    /**************************************************************
     * High Contrast IRIS Variation
     ****************************************************************/
    private static BufferedImage applyHighContrastIRISVariation(BufferedImage originalImage, int index) {
        // Calculate contrast factor (e.g., ranging from 1.1 to 2.0)
        float contrastFactor = 1.0f + (50 * 0.02f); // Adjust contrast factor as needed

        strIRISvariation = "HighContrast";
        // Contrast adjustment with RescaleOp
        float scaleFactor = contrastFactor; // Contrast scaling factor
        float offset = 0f; // No offset, just scaling

        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);

        // Apply the contrast adjustment to the image
        BufferedImage highContrastImage = rescaleOp.filter(originalImage, null);

        return highContrastImage;
    }

    /**************************************************************
     * Bight IRIS Variation
     ****************************************************************/
    private static BufferedImage applyBrightIRISVariation(BufferedImage originalImage, int index) {
        strIRISvariation = "Bright";
        // Calculate brightness factor (e.g., ranging from 1.1 to 2.0)
        float brightnessFactor = 1.0f + (index * 0.01f);

        // Create a RescaleOp to adjust the brightness
        RescaleOp rescaleOp = new RescaleOp(brightnessFactor, 0, null);

        // Apply the brightness adjustment to the image
        BufferedImage brightenedImage = rescaleOp.filter(originalImage, null);

        return brightenedImage;
    }

    /**************************************************************
     * Blur IRIS Variation
     ****************************************************************/
    private static BufferedImage applyBlurIRISVariation(BufferedImage originalImage, int index) {
        strIRISvariation = "Blur";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        BufferedImage modifiedImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = modifiedImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);
        g2d.dispose();
        // Apply a combination of transformations
        addNoise(modifiedImage);
        // applyRadialBlur(modifiedImage);
        distortPattern(modifiedImage, index);
        return modifiedImage;
    }

    // Function to add random noise to the image
    private static void addNoise(BufferedImage image) {
        Random rand = new Random();
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                int gray = new Color(image.getRGB(x, y)).getRed();
                int noise = rand.nextInt(50) - 25; // Adding noise
                gray = Math.min(255, Math.max(0, gray + noise));
                Color color = new Color(gray, gray, gray);
                image.setRGB(x, y, color.getRGB());
            }
        }
    }

    // Function to apply radial blur to the image
    private static void applyRadialBlur(BufferedImage image) {
        int centerX = image.getWidth() / 2;
        int centerY = image.getHeight() / 2;
        double blurRadius = Math.min(centerX, centerY) * 0.5;
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                double distance = Math.hypot(centerX - x, centerY - y);
                double blurAmount = Math.max(0, 1 - distance / blurRadius);
                int gray = new Color(image.getRGB(x, y)).getRed();
                gray = (int) (gray * blurAmount + 128 * (1 - blurAmount));
                Color color = new Color(gray, gray, gray);
                image.setRGB(x, y, color.getRGB());
            }
        }
    }

    // Function to distort the pattern slightly
    private static void distortPattern(BufferedImage image, int index) {
        Random rand = new Random(index);
        int width = image.getWidth();
        int height = image.getHeight();
        for (int y = 0; y < height; y++) {
            int offset = rand.nextInt(5) - 2; // Small horizontal shift
            for (int x = 0; x < width - Math.abs(offset); x++) {
                int shiftedX = (offset > 0) ? x : x - offset;
                int gray = new Color(image.getRGB(shiftedX, y)).getRed();
                image.setRGB(x, y, new Color(gray, gray, gray).getRGB());
            }
        }
    }

    /*********************************************************************************** */

    public static List<String> listFiles(String directoryPath) throws IOException {
        List<String> fileNames = new ArrayList<>();

        // Start walking through the file tree
        Files.walkFileTree(Paths.get(directoryPath), new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                // Add the file name to the list
                fileNames.add(file.toString());
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
                // If a file visit fails, print the error and continue
                System.err.println("Failed to access file: " + file.toString() + " (" + exc.getMessage() + ")");
                return FileVisitResult.CONTINUE;
            }
        });
        return fileNames;
    }

}