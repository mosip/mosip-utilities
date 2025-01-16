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
import java.awt.geom.Point2D;
import java.awt.MultipleGradientPaint.CycleMethod;
import java.awt.*;

public class FaceVariationGenerator {

    static String strFaceVariation = "Original";

    public static final int HIGH_CONTRAST_FACE = 1 << 0; // 00000001
    public static final int LOW_CONTRAST_FACE = 1 << 1; // 00000010
    public static final int LOW_BRIGHT_FACE = 1 << 2; // 00000100
    public static final int HIGH_BRIGHT_FACE = 1 << 3; // 00001000
    public static final int UNNATURAL_SKIN_TONE_FACE = 1 << 4; // 00010000
    public static final int HIGH_RESOLUTION_FACE = 1 << 5; // 00100000
    public static final int LOW_RESOLUTION_FACE = 1 << 6; // 01000000
    public static final int SHADOW_ON_FACE = 1 << 7; // 10000000
    public static final int OVER_EXPOSURE_FACE = 1 << 8; // 00000001 00000000
    public static final int UNDER_EXPOSURE_FACE = 1 << 9; // 00000010 00000000
    public static final int BLURRED_FACE = 1 << 10; // 00000100 00000000
    public static final int NOISY_FACE = 1 << 11; // 00001000 00000000
    public static final int SKEWED_FACE = 1 << 12; // 00010000 00000000
    public static final int AGED_FACE = 1 << 13; // 00100000 00000000

    // Variable to store the combination of variations
    public static int faceVariations = 0;

    public static void main(String[] args) throws IOException {

        // Check if the correct number of arguments is provided
        if (args.length < 2) {
            System.out.println("Usage: java FaceVariationGenerator <inputFaceTemplateDirectoryPath> <outputUniqueFaceDataPath>");
            return;
        }

        /// Provide folder where the base template image present
        String inputFaceTemplateDirectoryPath = args[0]; //"C:\\Users\\sivan\\Downloads\\SynData\\template\\face_data";

        /// Provide folder to where the generated variant images should be copied
        String outputUniqueFaceDataPath = args[1]; //"C:\\Users\\sivan\\Downloads\\SynData\\output\\face_data";

        generatefaceVariations(inputFaceTemplateDirectoryPath, outputUniqueFaceDataPath);

        System.out.println("Face variations generated for the given base imaages.");
    }

    /**************************************************************
     * Generates mutlple variations based on the provided
     * input image and copies to the target folder
     ****************************************************************/
    public static void generatefaceVariations(String inputFaceTemplateDirectoryPath, String outputUniqueFaceDataPath) {

        resetFaceVariations();

        // Set multiple variations at once
        setFaceVariations(
                HIGH_CONTRAST_FACE | LOW_CONTRAST_FACE | LOW_BRIGHT_FACE | HIGH_BRIGHT_FACE | UNNATURAL_SKIN_TONE_FACE
                        | HIGH_RESOLUTION_FACE | LOW_RESOLUTION_FACE | SHADOW_ON_FACE | OVER_EXPOSURE_FACE
                        | UNDER_EXPOSURE_FACE | BLURRED_FACE | NOISY_FACE | SKEWED_FACE | AGED_FACE);

        try {
            // Get all file names in the directory and subdirectories
            List<String> fileNameAbsPaths = listFiles(inputFaceTemplateDirectoryPath);

            for (String fileNameAbsPath : fileNameAbsPaths) {
                // Convert the string path to a Path object
                Path path = Paths.get(fileNameAbsPath);

                // Get the file name
                String fileName = path.getFileName().toString();

                // Get the parent directory of the file
                Path parentPath = path.getParent();

                // Extract the last two segments from the parent path
                String extractedPath = parentPath.getName(parentPath.getNameCount() - 1).toString();
                generatefaceVariations(fileNameAbsPath, outputUniqueFaceDataPath, extractedPath, fileName);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Method to set multiple variations
    public static void setFaceVariations(int variations) {
        faceVariations |= variations;
    }

    // Method to reset all variations
    public static void resetFaceVariations() {
        faceVariations = 0;
    }

    // Method to check if a specific variation is set
    public static boolean isVariationSet(int variation) {
        return (faceVariations & variation) != 0;
    }

    public static void generatefaceVariations(String fileNameAbsPath,
            String outputUniqueFaceDataPath, String FACEPath, String FileName) {

        // Create a list of active Variations based on boolean flags
        List<BiFunction<BufferedImage, Integer, BufferedImage>> activeVariations = new ArrayList<>();
        if (isVariationSet(LOW_CONTRAST_FACE))
            activeVariations.add(FaceVariationGenerator::applyLowContrastFaceVariation);
        if (isVariationSet(HIGH_CONTRAST_FACE))
            activeVariations.add(FaceVariationGenerator::applyHighContrastFaceVariation);
        if (isVariationSet(LOW_BRIGHT_FACE))
            activeVariations.add(FaceVariationGenerator::applyLowBrightFaceVariation);
        if (isVariationSet(HIGH_BRIGHT_FACE))
            activeVariations.add(FaceVariationGenerator::applyHighBrightFaceVariation);
        if (isVariationSet(UNNATURAL_SKIN_TONE_FACE))
            activeVariations.add(FaceVariationGenerator::applyUnnaturalSkinToneFaceVariation);
        if (isVariationSet(HIGH_RESOLUTION_FACE))
            activeVariations.add(FaceVariationGenerator::applyHighResolutionFaceVariation);
        if (isVariationSet(LOW_RESOLUTION_FACE))
            activeVariations.add(FaceVariationGenerator::applyLowResolutionFaceVariation);
        if (isVariationSet(SHADOW_ON_FACE))
            activeVariations.add(FaceVariationGenerator::applyShadowOnFaceVariation);
        if (isVariationSet(OVER_EXPOSURE_FACE))
            activeVariations.add(FaceVariationGenerator::applyOverExposureFaceVariation);
        if (isVariationSet(UNDER_EXPOSURE_FACE))
            activeVariations.add(FaceVariationGenerator::applyUnderExposureFaceVariation);
        if (isVariationSet(BLURRED_FACE))
            activeVariations.add(FaceVariationGenerator::applyBlurredFaceVariation);
        if (isVariationSet(NOISY_FACE))
            activeVariations.add(FaceVariationGenerator::applyNosiyFaceVariation);
        if (isVariationSet(SKEWED_FACE))
            activeVariations.add(FaceVariationGenerator::applySkewedFaceVariation);
        if (isVariationSet(AGED_FACE))
            activeVariations.add(FaceVariationGenerator::applyAgedFaceVariation);

        // Load the original FACE image
        strFaceVariation = "Original";
        BufferedImage faceImage = null;
        try {
            faceImage = ImageIO.read(new File(fileNameAbsPath));
        } catch (IOException e) {
            // Handle the exception (e.g., log it, notify the user, etc.)
            e.printStackTrace();
        }

        if (faceImage == null) {
            System.out.println("Failed to load face image.");
            return;
        }

        String outputFacePath = Paths.get(outputUniqueFaceDataPath, FACEPath, strFaceVariation + "_" + FileName).toString();
        
        // System.out.println("------------------" + outputFacePath);
        // Create directories if they do not exist
        Path outputPath = Paths.get(outputFacePath).getParent();

        // First copy the original image as well
        try {
            if (!Files.exists(outputPath)) {
                Files.createDirectories(outputPath);
            }
            ImageIO.write(faceImage, "png", new File(outputFacePath));
        } catch (IOException e) {
            System.err.println(e.getMessage());
        }

        // Apply the Variations and genearate varations for this profile
        for (int j = 1; j <= activeVariations.size(); j++) {
            BiFunction<BufferedImage, Integer, BufferedImage> Variation = activeVariations
                    .get((j - 1) % activeVariations.size());
            BufferedImage faceImageWithVariation = Variation.apply(faceImage, j);

            outputFacePath = Paths.get(outputUniqueFaceDataPath, FACEPath, strFaceVariation + "_" + FileName).toString();
            // System.out.println("XXXXXXXXXXXXXXXX------------------" + outputFacePath);

            try {
                ImageIO.write(faceImageWithVariation, "png", new File(outputFacePath));
            } catch (IOException e) {
                // Handle the exception (e.g., log it, notify the user, etc.)
                e.printStackTrace();
                System.err.println(e.getMessage());
            }
        }
    }

    /**************************************************************
     * Aged Face Variation
     ****************************************************************/
    private static BufferedImage applyAgedFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "Aged";

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        BufferedImage agedImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = agedImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Simulate wrinkles without dark spots or hair color change
        applyWrinkles(agedImage);

        // Optional: Apply additional sharpening to enhance wrinkles
        sharpenImage(agedImage);

        g2d.dispose();
        return agedImage;
    }

    private static void applyWrinkles(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        Random random = new Random();

        for (int y = height / 4; y < 3 * height / 4; y++) { // Focus wrinkles on the middle section of the face
            for (int x = width / 4; x < 3 * width / 4; x++) { // Avoid edges of the face
                if (random.nextDouble() > 0.99) { // Sparsely add wrinkle effects
                    Color originalColor = new Color(image.getRGB(x, y));
                    int wrinkleIntensity = Math.max(0, originalColor.getRed() - 30); // Light wrinkles
                    int wrinkleColor = new Color(wrinkleIntensity, wrinkleIntensity, wrinkleIntensity).getRGB();
                    image.setRGB(x, y, wrinkleColor);
                }
            }
        }
    }

    private static void sharpenImage(BufferedImage image) {
        float[] sharpenMatrix = {
                0, -1, 0,
                -1, 5, -1,
                0, -1, 0
        };

        applyConvolution(image, sharpenMatrix);
    }

    private static void applyConvolution(BufferedImage image, float[] matrix) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage tempImage = new BufferedImage(width, height, image.getType());

        int matrixSize = (int) Math.sqrt(matrix.length);
        int offset = matrixSize / 2;

        for (int y = offset; y < height - offset; y++) {
            for (int x = offset; x < width - offset; x++) {
                float redSum = 0, greenSum = 0, blueSum = 0;

                for (int j = 0; j < matrixSize; j++) {
                    for (int i = 0; i < matrixSize; i++) {
                        int pixel = image.getRGB(x + i - offset, y + j - offset);
                        Color color = new Color(pixel);

                        redSum += color.getRed() * matrix[j * matrixSize + i];
                        greenSum += color.getGreen() * matrix[j * matrixSize + i];
                        blueSum += color.getBlue() * matrix[j * matrixSize + i];
                    }
                }

                int r = Math.min(Math.max((int) redSum, 0), 255);
                int g = Math.min(Math.max((int) greenSum, 0), 255);
                int b = Math.min(Math.max((int) blueSum, 0), 255);

                int newColor = new Color(r, g, b).getRGB();
                tempImage.setRGB(x, y, newColor);
            }
        }

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                image.setRGB(x, y, tempImage.getRGB(x, y));
            }
        }
    }

    /**************************************************************
     * Skewed Face Variation
     ****************************************************************/
    private static BufferedImage applySkewedFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "Skewed";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Apply the skew effect with desired skew factors
        double skewX = 0.3; // Skew factor along the x-axis (positive value slants to the right, negative to
                            // the left)
        double skewY = 0.2; // Skew factor along the y-axis (positive value slants downwards, negative
                            // upwards)

        // Create a new image with the same dimensions
        BufferedImage skewedImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = skewedImage.createGraphics();

        // Get the background color from the original image
        Color backgroundColor = getBackgroundColor(originalImage);

        // Fill the entire skewed image with the background color
        g2d.setColor(backgroundColor);
        g2d.fillRect(0, 0, width, height);

        // Create the affine transform for skewing
        AffineTransform transform = new AffineTransform();
        transform.shear(skewX, skewY);

        // Apply the transform to the graphics context
        g2d.setTransform(transform);

        // Draw the original image onto the skewed graphics context
        g2d.drawImage(originalImage, 0, 0, null);

        // Clean up
        g2d.dispose();

        return skewedImage;
    }

    // Method to extract the background color from the top-left corner of the image
    private static Color getBackgroundColor(BufferedImage image) {
        return new Color(image.getRGB(0, 0)); // Assuming the background color is at (0, 0)
    }

    /**************************************************************
     * Noisy Face Variation
     ****************************************************************/
    private static BufferedImage applyNosiyFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "Noisy";

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Apply the noise effect with desired noise level
        float noiseLevel = 20.0f; // Increase this value for more noise
        BufferedImage noisyImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = noisyImage.createGraphics();

        // Draw the original image on the new image
        g2d.drawImage(originalImage, 0, 0, null);
        g2d.dispose();

        Random random = new Random();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(originalImage.getRGB(x, y));

                // Generate random noise to add or subtract from the RGB values
                int noise = (int) (random.nextGaussian() * noiseLevel);

                int red = clamp(originalColor.getRed() + noise);
                int green = clamp(originalColor.getGreen() + noise);
                int blue = clamp(originalColor.getBlue() + noise);

                // Set the noisy color
                Color noisyColor = new Color(red, green, blue);
                noisyImage.setRGB(x, y, noisyColor.getRGB());
            }
        }

        return noisyImage;
    }

    // Clamps the color value to be within the 0-255 range
    private static int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }

    /**************************************************************
     * Blurred Face Variation
     ****************************************************************/
    private static BufferedImage applyBlurredFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "Blurred";

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Apply the blur effect with desired blur radius
        int blurRadius = 5; // Increase the radius for a stronger blur effect
        BufferedImage blurredImage = new BufferedImage(width, height, originalImage.getType());

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color blurredColor = calculateAverageColor(originalImage, x, y, blurRadius);
                blurredImage.setRGB(x, y, blurredColor.getRGB());
            }
        }

        return blurredImage;
    }

    // Helper method to calculate the average color of the neighboring pixels
    private static Color calculateAverageColor(BufferedImage image, int x, int y, int radius) {
        int red = 0, green = 0, blue = 0, count = 0;

        for (int row = -radius; row <= radius; row++) {
            for (int col = -radius; col <= radius; col++) {
                int currentX = x + col;
                int currentY = y + row;

                if (currentX >= 0 && currentX < image.getWidth() && currentY >= 0 && currentY < image.getHeight()) {
                    Color pixelColor = new Color(image.getRGB(currentX, currentY));
                    red += pixelColor.getRed();
                    green += pixelColor.getGreen();
                    blue += pixelColor.getBlue();
                    count++;
                }
            }
        }

        return new Color(red / count, green / count, blue / count);
    }

    /**************************************************************
     * Under exposure On Face Variation
     ****************************************************************/
    private static BufferedImage applyUnderExposureFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "UnderExposure";

        // Apply the underexposure effect with desired exposure level
        float exposureLevel = 0.5f; // Decrease this value to darken the image more (1.0 = no change)
        return addUnderexposureEffect(originalImage, exposureLevel);
    }

    /**************************************************************
     * Over exposure On Face Variation
     ****************************************************************/
    private static BufferedImage applyOverExposureFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "OverExposure";

        // Apply the overexposure effect with desired exposure level
        float exposureLevel = 2.0f; // Increase this value to intensify overexposure (1.0 = no change)
        return addUnderexposureEffect(originalImage, exposureLevel);
    }

    public static BufferedImage addUnderexposureEffect(BufferedImage originalImage, float exposureLevel) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same size as the original
        BufferedImage exposedImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = exposedImage.createGraphics();

        // Draw the original image on the new image
        g2d.drawImage(originalImage, 0, 0, null);

        // Apply overexposure effect by increasing brightness
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                // Get the current pixel color
                Color originalColor = new Color(originalImage.getRGB(x, y));

                // Increase the brightness of the color
                int red = Math.min((int) (originalColor.getRed() * exposureLevel), 255);
                int green = Math.min((int) (originalColor.getGreen() * exposureLevel), 255);
                int blue = Math.min((int) (originalColor.getBlue() * exposureLevel), 255);

                // Set the new overexposed color
                Color exposedImageColor = new Color(red, green, blue);
                exposedImage.setRGB(x, y, exposedImageColor.getRGB());
            }
        }

        // Clean up
        g2d.dispose();

        return exposedImage;
    }

    /**************************************************************
     * Shadow On Face Variation
     ****************************************************************/
    private static BufferedImage applyShadowOnFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "Shadow";

        // Apply the shadow effect with desired parameters
        float shadowOpacity = 0.5f; // Opacity of the shadow (0.0 to 1.0)
        int shadowDirection = 135; // Direction of the shadow in degrees (0-360)
        int shadowLength = 200; // Length of the shadow in pixels

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same size as the original
        BufferedImage shadowedImage = new BufferedImage(width, height, originalImage.getType());
        Graphics2D g2d = shadowedImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Set up the shadow color with the specified opacity
        Color shadowColor = new Color(0, 0, 0, (int) (255 * shadowOpacity));

        // Calculate the shadow endpoint based on direction and length
        double angle = Math.toRadians(shadowDirection);
        int xOffset = (int) (Math.cos(angle) * shadowLength);
        int yOffset = (int) (Math.sin(angle) * shadowLength);

        // Create a gradient for the shadow
        Point2D start = new Point2D.Float(width / 2f, height / 2f);
        Point2D end = new Point2D.Float(width / 2f + xOffset, height / 2f + yOffset);
        float[] fractions = { 0.0f, 1.0f };
        Color[] colors = { shadowColor, new Color(0, 0, 0, 0) };
        LinearGradientPaint shadowPaint = new LinearGradientPaint(start, end, fractions, colors, CycleMethod.NO_CYCLE);

        // Apply the shadow
        g2d.setComposite(AlphaComposite.SrcOver);
        g2d.setPaint(shadowPaint);
        g2d.fillRect(0, 0, width, height);

        // Clean up
        g2d.dispose();

        return shadowedImage;
    }

    /**************************************************************
     * Hight Resolution Face Variation
     ****************************************************************/
    private static BufferedImage applyHighResolutionFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "HighResolution";
        float factor = 1.4f;
        return adjustBrightness(originalImage, factor);
    }

    /**************************************************************
     * Low Resolution Face Variation
     ****************************************************************/
    private static BufferedImage applyLowResolutionFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "LowResolution";
        // Create a low-resolution effect with a factor of 8
        BufferedImage lowResImage = createLowResolutionEffect(originalImage, 5);

        // Apply brightness adjustment to the low-resolution image
        return adjustBrightness(lowResImage, 1.2f); // Increase brightness by 20%
    }

    public static BufferedImage createLowResolutionEffect(BufferedImage originalImage, int factor) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Downscale the image
        BufferedImage downscaledImage = new BufferedImage(width / factor, height / factor, originalImage.getType());
        Graphics2D g2d = downscaledImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, width / factor, height / factor, null);
        g2d.dispose();

        // Upscale the image back to the original size
        BufferedImage upscaledImage = new BufferedImage(width, height, originalImage.getType());
        g2d = upscaledImage.createGraphics();
        g2d.drawImage(downscaledImage, 0, 0, width, height, null);
        g2d.dispose();

        return upscaledImage;
    }

    /**************************************************************
     * Unnatural Skin Tone Face Variation
     ****************************************************************/
    private static BufferedImage applyUnnaturalSkinToneFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "UnnaturalSkinTone";

        return adjustColorChannel(originalImage, 1.1f, 1.0f, 0.9f); // Warmer tone
    }

    public static BufferedImage adjustColorChannel(BufferedImage image, float redFactor, float greenFactor,
            float blueFactor) {
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, image.getType());

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));

                int r = (int) Math.min(255, Math.max(0, color.getRed() * redFactor));
                int g = (int) Math.min(255, Math.max(0, color.getGreen() * greenFactor));
                int b = (int) Math.min(255, Math.max(0, color.getBlue() * blueFactor));

                Color newColor = new Color(r, g, b);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        return result;
    }

    /**************************************************************
     * Low Bright Face Variation
     ****************************************************************/
    private static BufferedImage applyLowBrightFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "LowBright";

        float factor = 0.5f;
        return adjustBrightness(originalImage, factor);
    }

    /**************************************************************
     * High Bright Face Variation
     ****************************************************************/
    private static BufferedImage applyHighBrightFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "HighBright";

        float factor = 1.2f;
        return adjustBrightness(originalImage, factor);
    }

    public static BufferedImage adjustBrightness(BufferedImage image, float factor) {

        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, image.getType());

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));

                int r = (int) Math.min(255, Math.max(0, color.getRed() * factor));
                int g = (int) Math.min(255, Math.max(0, color.getGreen() * factor));
                int b = (int) Math.min(255, Math.max(0, color.getBlue() * factor));

                Color newColor = new Color(r, g, b);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        return result;
    }

    /**************************************************************
     * High Contrast Face Variation
     ****************************************************************/
    private static BufferedImage applyHighContrastFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "HighContrast";
        float factor = 1.5f;

        return adjustContrast(originalImage, factor);
    }

    /**************************************************************
     * Low Contrast Face Variation
     ****************************************************************/
    private static BufferedImage applyLowContrastFaceVariation(BufferedImage originalImage, int index) {
        strFaceVariation = "LowContrast";

        float factor = 0.1f;

        return adjustContrast(originalImage, factor);
    }

    public static BufferedImage adjustContrast(BufferedImage image, float factor) {

        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage result = new BufferedImage(width, height, image.getType());

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color color = new Color(image.getRGB(x, y));

                int r = (int) Math.min(255, Math.max(0, ((color.getRed() - 128) * factor) + 128));
                int g = (int) Math.min(255, Math.max(0, ((color.getGreen() - 128) * factor) + 128));
                int b = (int) Math.min(255, Math.max(0, ((color.getBlue() - 128) * factor) + 128));

                Color newColor = new Color(r, g, b);
                result.setRGB(x, y, newColor.getRGB());
            }
        }

        return result;
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