package auth.sdk.java.models;

import lombok.Getter;
import lombok.Setter;

import java.util.*;

@Getter
@Setter
public class DemographicsModel {
    private String dob = "";
    private List<IdentityInfo> name = new ArrayList<>();
    private List<IdentityInfo> gender = new ArrayList<>();
    private String phoneNumber = "";
    private String emailId = "";
    private List<IdentityInfo> fullAddress = new ArrayList<>();

}